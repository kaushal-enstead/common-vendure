import { TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { NobrindeBudget, NobrindeBudgetLine } from '../../nobrinde-entity/entities/nobrinde-budgets';
import { parseJson } from '../utils/helper';
import { RemoteTableConfig, SyncResult } from '../types';
import { SyncService } from '../services/sync-service';
import { DEFAULT_BATCH_SIZE } from '../constants';

const LINES_TABLE = 'VORCAMENTOS_LINHAS';

export type BudgetRemoteRow = Record<string, unknown> & { lines?: string | null };

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown, maxLen?: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  if (maxLen != null && s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

/** Map remote header row (excluding `lines`) onto NobrindeBudget fields. */
export function remoteRowToBudgetPayload(row: BudgetRemoteRow): Partial<NobrindeBudget> {
  const idPhc = num(row.id_phc);
  if (idPhc == null) {
    throw new Error('Budget row missing id_phc');
  }
  return {
    id_phc: idPhc,
    id_site: num(row.id_site),
    nr_doc_pv: num(row.nr_doc_pv),
    data_documento: str(row.data_documento, 50),
    tipo_reg: num(row.tipo_reg),
    serie: str(row.serie, 50),
    nr_entidade: num(row.nr_entidade),
    estabelecimento: num(row.estabelecimento),
    empresa: str(row.empresa, 64),
    morada: str(row.morada, 50),
    localidade: str(row.localidade, 50),
    c_postal: str(row.c_postal, 50),
    nif: str(row.nif, 50),
    cond_pagamento: str(row.cond_pagamento, 255),
    morada_entrega: str(row.morada_entrega, 50),
    data_expedicao: str(row.data_expedicao, 50),
    total_liq: str(row.total_liq, 50),
    iva: num(row.iva) as number | null,
    taxa_iva: num(row.taxa_iva) as number | null,
    total: num(row.total) as number | null,
    observacoes: str(row.observacoes, 255),
    sigla_comercial: str(row.sigla_comercial, 50),
    desc_comercial: str(row.desc_comercial, 7),
    tracking: str(row.tracking, 1),
  };
}

export function remoteRowToLinePayload(row: Record<string, unknown>, headerIdPhc: number): Partial<NobrindeBudgetLine> {
  return {
    id_phc: headerIdPhc,
    id_linhas: str(row.id_linhas, 50) ?? '',
    ordem: num(row.ordem),
    referencia_externa: str(row.referencia_externa, 50),
    referencia: str(row.referencia, 50),
    nome_produto: str(row.nome_produto, 64),
    qtdd: num(row.qtdd),
    preco_unit: num(row.preco_unit) as number | null,
    desc: num(row.desc) as number | null,
    preco_unit_desc: num(row.preco_unit_desc) as number | null,
    total: num(row.total) as number | null,
    iva: num(row.iva) as number | null,
  };
}

function parseLineArray(raw: unknown): Record<string, unknown>[] {
  const parsed = parseJson<unknown>(raw as string | null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  return [parsed as Record<string, unknown>];
}

function stripLinesColumn(row: BudgetRemoteRow): BudgetRemoteRow {
  const { lines: _l, ...rest } = row;
  return rest;
}

function buildLinesJsonSelect(mainAlias: string): string {
  return `(SELECT l.* FROM ${LINES_TABLE} l WHERE l.id_phc = ${mainAlias}.id_phc FOR JSON PATH) AS lines`;
}

/** Paged fetch: optional incremental filter on `timestampColumn`, ordered ascending. */
export async function fetchNobrindeBudgetPage(
  syncService: SyncService,
  tableConfig: RemoteTableConfig,
  lastSync: Date | null | undefined,
  offset: number,
): Promise<BudgetRemoteRow[]> {
  const { name, batchSize, timestampColumn } = tableConfig;
  const limit = batchSize ?? DEFAULT_BATCH_SIZE;
  const tsCol = timestampColumn ?? 'data_documento';

  const lastParam = lastSync != null ? lastSync.toISOString() : null;
  const sql = `SELECT h.*, ${buildLinesJsonSelect('h')}
FROM ${name} h
WHERE (@p0 IS NULL OR h.${tsCol} >= @p0)
ORDER BY h.${tsCol} ASC
OFFSET @p1 ROWS FETCH NEXT @p2 ROWS ONLY`;

  return syncService.executeQuery<BudgetRemoteRow>(sql, [lastParam, offset, limit]);
}

/** Fetch headers (with nested lines JSON) for specific remote id_phc values. */
export async function fetchNobrindeBudgetsByIdPhc(
  syncService: SyncService,
  tableConfig: RemoteTableConfig,
  idPhcs: number[],
): Promise<BudgetRemoteRow[]> {
  const unique = [...new Set(idPhcs.filter(n => n != null))];
  if (!unique.length) return [];

  const { name } = tableConfig;
  const placeholders = unique.map((_, i) => `@p${i}`).join(', ');
  const sql = `SELECT h.*, ${buildLinesJsonSelect('h')}
FROM ${name} h
WHERE h.id_phc IN (${placeholders})`;

  return syncService.executeQuery<BudgetRemoteRow>(sql, unique);
}

/**
 * Upsert each budget by id_phc and replace all lines for that budget (delete + insert).
 * Runs in one DB transaction.
 */
export async function applyNobrindeBudgetRowsFromRemote(
  connection: TransactionalConnection,
  rows: BudgetRemoteRow[],
  resultObject: SyncResult,
): Promise<void> {
  if (!rows.length) return;

  await connection.rawConnection.transaction(async manager => {
    const budgetRepo = manager.getRepository(NobrindeBudget);
    const lineRepo = manager.getRepository(NobrindeBudgetLine);

    const idPhcs = rows.map(r => num(r.id_phc)).filter((n): n is number => n != null);
    const existingBudgets =
      idPhcs.length > 0
        ? await budgetRepo.find({ where: { id_phc: In(idPhcs) } })
        : [];
    const byPhc = new Map(existingBudgets.map(b => [b.id_phc, b]));

    for (const raw of rows) {
      const idPhc = num(raw.id_phc);
      if (idPhc == null) continue;

      const headerRest = stripLinesColumn(raw);
      const payload = remoteRowToBudgetPayload(headerRest);
      delete (payload as { pdfAssetId?: unknown }).pdfAssetId;

      const existing = byPhc.get(idPhc);
      let budgetId: string;

      if (existing) {
        budgetId = String(existing.id);
        await budgetRepo.save({
          ...payload,
          id: budgetId,
          pdfAssetId: existing.pdfAssetId,
        } as NobrindeBudget);
        resultObject.updatedRows += 1;
      } else {
        const created = budgetRepo.create(payload as NobrindeBudget);
        const saved = await budgetRepo.save(created);
        budgetId = String(saved.id);
        byPhc.set(idPhc, saved);
        resultObject.insertedRows += 1;
      }

      await lineRepo.delete({ budget: { id: budgetId } });

      const lineRows = parseLineArray(raw.lines);
      if (lineRows.length === 0) continue;

      const lineEntities = lineRows.map(lr =>
        lineRepo.create({
          ...remoteRowToLinePayload(lr, idPhc),
          budget: { id: budgetId } as NobrindeBudget,
        }),
      );
      await lineRepo.save(lineEntities, { chunk: 100 });
      resultObject.insertedRows += lineEntities.length;
    }
  });
}
