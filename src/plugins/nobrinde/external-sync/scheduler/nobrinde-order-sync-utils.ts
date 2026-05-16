import { TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { NobrindeOrder, NobrindeOrderLine } from '../../nobrinde-entity/entities/nobrinde-orders';
import { parseJson } from '../utils/helper';
import { RemoteTableConfig, SyncResult } from '../types';
import { SyncService } from '../services/sync-service';
import { DEFAULT_BATCH_SIZE } from '../constants';

const LINES_TABLE = 'VENCOMENDAS_LINHAS';

export type OrderRemoteRow = Record<string, unknown> & { lines?: string | null };

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

function intOrNull(v: unknown): number | null {
  const n = num(v);
  if (n == null) return null;
  return Math.trunc(n);
}

/** Map remote header row (excluding `lines`) onto NobrindeOrder fields. */
export function remoteRowToOrderPayload(row: OrderRemoteRow): Partial<NobrindeOrder> {
  const idPhc = num(row.id_phc);
  if (idPhc == null) {
    throw new Error('Order row missing id_phc');
  }
  return {
    id_phc: idPhc,
    id_site: str(row.id_site, 50),
    nr_doc_pv: num(row.nr_doc_pv),
    data_documento: str(row.data_documento, 50),
    tipo_reg: num(row.tipo_reg),
    serie: str(row.serie, 50),
    nr_entidade: num(row.nr_entidade),
    estabelecimento: num(row.estabelecimento),
    empresa: str(row.empresa, 64),
    morada: str(row.morada, 64),
    localidade: str(row.localidade, 50),
    c_postal: str(row.c_postal, 50),
    nif: str(row.nif, 50),
    cond_pagamento: str(row.cond_pagamento, 50),
    morada_entrega: str(row.morada_entrega, 64),
    data_expedicao: str(row.data_expedicao, 50),
    total_liq: num(row.total_liq) as number | null,
    iva: num(row.iva) as number | null,
    taxa_iva: num(row.taxa_iva) as number | null,
    total: num(row.total) as number | null,
    observacoes: str(row.observacoes),
    sigla_comercial: str(row.sigla_comercial),
    desc_comercial: num(row.desc_comercial) as number | null,
    tracking: str(row.tracking, 50),
  };
}

export function remoteRowToOrderLinePayload(
  row: Record<string, unknown>,
  headerIdPhc: number,
): Partial<NobrindeOrderLine> {
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
    preco_unit_desc: intOrNull(row.preco_unit_desc),
    total: num(row.total) as number | null,
    iva: num(row.iva) as number | null,
    estado: str(row.estado, 50),
  };
}

function parseLineArray(raw: unknown): Record<string, unknown>[] {
  const parsed = parseJson<unknown>(raw as string | null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  return [parsed as Record<string, unknown>];
}

function stripLinesColumn(row: OrderRemoteRow): OrderRemoteRow {
  const { lines: _l, ...rest } = row;
  return rest;
}

function buildLinesJsonSelect(mainAlias: string): string {
  return `(SELECT l.* FROM ${LINES_TABLE} l WHERE l.id_phc = ${mainAlias}.id_phc FOR JSON PATH) AS lines`;
}

export async function fetchNobrindeOrderPage(
  syncService: SyncService,
  tableConfig: RemoteTableConfig,
  lastSync: Date | null | undefined,
  offset: number,
): Promise<OrderRemoteRow[]> {
  const { name, batchSize, timestampColumn } = tableConfig;
  const limit = batchSize ?? DEFAULT_BATCH_SIZE;
  const tsCol = timestampColumn ?? 'data_documento';

  const lastParam = lastSync != null ? lastSync.toISOString() : null;
  const sql = `SELECT h.*, ${buildLinesJsonSelect('h')}
FROM ${name} h
WHERE (@p0 IS NULL OR h.${tsCol} >= @p0)
ORDER BY h.${tsCol} ASC
OFFSET @p1 ROWS FETCH NEXT @p2 ROWS ONLY`;

  return syncService.executeQuery<OrderRemoteRow>(sql, [lastParam, offset, limit]);
}

export async function fetchNobrindeOrdersByIdPhc(
  syncService: SyncService,
  tableConfig: RemoteTableConfig,
  idPhcs: number[],
): Promise<OrderRemoteRow[]> {
  const unique = [...new Set(idPhcs.filter(n => n != null))];
  if (!unique.length) return [];

  const { name } = tableConfig;
  const placeholders = unique.map((_, i) => `@p${i}`).join(', ');
  const sql = `SELECT h.*, ${buildLinesJsonSelect('h')}
FROM ${name} h
WHERE h.id_phc IN (${placeholders})`;

  return syncService.executeQuery<OrderRemoteRow>(sql, unique);
}

export async function applyNobrindeOrderRowsFromRemote(
  connection: TransactionalConnection,
  rows: OrderRemoteRow[],
  resultObject: SyncResult,
): Promise<void> {
  if (!rows.length) return;

  await connection.rawConnection.transaction(async manager => {
    const orderRepo = manager.getRepository(NobrindeOrder);
    const lineRepo = manager.getRepository(NobrindeOrderLine);

    const idPhcs = rows.map(r => num(r.id_phc)).filter((n): n is number => n != null);
    const existingOrders =
      idPhcs.length > 0 ? await orderRepo.find({ where: { id_phc: In(idPhcs) } }) : [];
    const byPhc = new Map(existingOrders.map(o => [o.id_phc, o]));

    for (const raw of rows) {
      const idPhc = num(raw.id_phc);
      if (idPhc == null) continue;

      const headerRest = stripLinesColumn(raw);
      const payload = remoteRowToOrderPayload(headerRest);

      const existing = byPhc.get(idPhc);
      let orderId: string;

      if (existing) {
        orderId = String(existing.id);
        await orderRepo.save({
          ...payload,
          id: orderId,
        } as NobrindeOrder);
        resultObject.updatedRows += 1;
      } else {
        const created = orderRepo.create(payload as NobrindeOrder);
        const saved = await orderRepo.save(created);
        orderId = String(saved.id);
        byPhc.set(idPhc, saved);
        resultObject.insertedRows += 1;
      }

      await lineRepo.delete({ order: { id: orderId } });

      const lineRows = parseLineArray(raw.lines);
      if (lineRows.length === 0) continue;

      const lineEntities = lineRows.map(lr =>
        lineRepo.create({
          ...remoteRowToOrderLinePayload(lr, idPhc),
          order: { id: orderId } as NobrindeOrder,
        }),
      );
      await lineRepo.save(lineEntities, { chunk: 100 });
      resultObject.insertedRows += lineEntities.length;
    }
  });
}
