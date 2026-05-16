import { Injectable } from '@nestjs/common';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  AssetService,
  Channel,
  ListQueryBuilder,
  ListQueryOptions,
  MimeTypeError,
  ProductVariant,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { Readable } from 'stream';
import { FindOptionsWhere } from 'typeorm';
import { NobrindeBudget, NobrindeBudgetLine } from '../entities/nobrinde-budgets';
import {
  BrandingContext,
  BudgetPdfLine,
  buildBudgetPdfBuffer,
} from './budget-pdf.generator';

export interface GenerateNobrindeBudgetPdfResult {
  success: boolean;
  asset?: { id: string; source: string; preview: string };
  error?: string;
}

const ASSETS_DIR = path.join(__dirname, '../../../../static/assets');

const FALLBACK_COLORS = {
  primary: '#0F172A',
  secondary: '#475569',
  foreground: '#111111',
  background: '#FFFFFF',
} as const;

const SUPPORTED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);

@Injectable()
export class NobrindeBudgetService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private assetService: AssetService,
  ) {}

  async findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<NobrindeBudget>,
    relations?: RelationPaths<NobrindeBudget>,
  ): Promise<PaginatedList<NobrindeBudget>> {
    const effectiveRelations = relations;
    return this.listQueryBuilder
      .build(NobrindeBudget, options, {
        relations: effectiveRelations,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  async findOne(ctx: RequestContext, id: ID): Promise<NobrindeBudget | null> {
    const repo = this.connection.getRepository(ctx, NobrindeBudget);
    return repo.findOne({ where: { id } as FindOptionsWhere<NobrindeBudget> });
  }

  async getLinesForBudget(ctx: RequestContext, budget: NobrindeBudget): Promise<NobrindeBudgetLine[]> {
    const lineRepo = this.connection.getRepository(ctx, NobrindeBudgetLine);
    return lineRepo.find({
      where: { budget: { id: budget.id } },
      order: { ordem: 'ASC' },
    });
  }

  async generatePdf(ctx: RequestContext, budgetId: ID): Promise<GenerateNobrindeBudgetPdfResult> {
    try {
      const budget = await this.findOne(ctx, budgetId);
      if (!budget) {
        return { success: false, error: 'Budget not found' };
      }
      let lines = budget.lines;
      if (!lines?.length) {
        lines = await this.getLinesForBudget(ctx, budget);
      }

      const branding = await this.buildBrandingContext(ctx);
      const pdfLines = await this.buildPdfLines(ctx, lines, branding.defaultCurrency);

      const pdfBuffer = await buildBudgetPdfBuffer({ budget, lines: pdfLines, branding });
      const stream = Readable.from(pdfBuffer);
      const fileName = `budget-${budget.id_phc}-${budgetId}.pdf`;

      const result = await this.assetService.createFromFileStream(stream, fileName, ctx);
      if (result instanceof MimeTypeError) {
        return { success: false, error: result.message ?? 'Invalid file type' };
      }
      const asset = result as { id: string; source: string; preview: string };

      const repo = this.connection.getRepository(ctx, NobrindeBudget);
      await repo.update({ id: budgetId } as FindOptionsWhere<NobrindeBudget>, { pdfAssetId: asset.id });

      return {
        success: true,
        asset: { id: asset.id, source: asset.source, preview: asset.preview },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate PDF';
      return { success: false, error: message };
    }
  }

  private async buildBrandingContext(ctx: RequestContext): Promise<BrandingContext> {
    const channel = await this.connection.getRepository(ctx, Channel).findOne({
      where: { id: ctx.channelId },
      relations: ['customFields.logo'],
    });

    const channelFields = (channel?.customFields ?? {}) as Record<string, unknown> & {
      logo?: { source?: string; preview?: string; mimeType?: string };
      colors?: { primary?: string; secondary?: string; foreground?: string; background?: string };
    };

    const colors = {
      primary: channelFields.colors?.primary || FALLBACK_COLORS.primary,
      secondary: channelFields.colors?.secondary || FALLBACK_COLORS.secondary,
      foreground: channelFields.colors?.foreground || FALLBACK_COLORS.foreground,
      background: channelFields.colors?.background || FALLBACK_COLORS.background,
    };

    const logoAsset = channelFields.logo;
    const logo = await this.readImageAsset(logoAsset?.source ?? null);

    return {
      storeName:
        (channelFields.storeDisplayName as string | undefined) || channel?.code || 'Store',
      storeAddress: stripHtml((channelFields.storeAddress as string | undefined) || ''),
      supportEmail: (channelFields.supportEmail as string | undefined) || '',
      billingEmail: (channelFields.billingEmail as string | undefined) || '',
      replyToEmail: (channelFields.replyToEmail as string | undefined) || '',
      domain: (channelFields.channelDomain as string | undefined) || '',
      privacyPolicyUrl: (channelFields.privacyPolicyUrl as string | undefined) || '',
      colors,
      logo,
      defaultCurrency: channel?.defaultCurrencyCode ?? 'EUR',
    };
  }

  private async buildPdfLines(
    ctx: RequestContext,
    lines: NobrindeBudgetLine[],
    defaultCurrency: string,
  ): Promise<BudgetPdfLine[]> {
    const variantRepo = this.connection.getRepository(ctx, ProductVariant);
    const result: BudgetPdfLine[] = [];

    for (const line of lines) {
      const sku = line.referencia_externa?.trim() || line.referencia?.trim() || '';
      const variant = sku
        ? await variantRepo.findOne({
            where: { sku },
            relations: ['featuredAsset'],
          })
        : null;

      const featuredAsset = variant?.featuredAsset as
        | { source?: string; preview?: string }
        | undefined;
      const image = await this.readImageAsset(featuredAsset?.preview ?? featuredAsset?.source ?? null);

      result.push({
        ordem: line.ordem,
        name: variant?.name || line.nome_produto || '–',
        sku: variant?.sku || line.referencia || line.referencia_externa || '',
        qtdd: line.qtdd,
        preco_unit: line.preco_unit,
        desc: line.desc,
        iva: line.iva,
        total: line.total,
        image,
        currency: defaultCurrency,
      });
    }

    return result;
  }

  private async readImageAsset(relativePath: string | null | undefined): Promise<BrandingContext['logo']> {
    if (!relativePath) return undefined;
    const ext = path.extname(relativePath).split('?')[0].toLowerCase();
    if (!SUPPORTED_IMAGE_EXTS.has(ext)) return undefined;

    if (/^https?:\/\//i.test(relativePath)) {
      const remoteImage = await this.fetchRemoteImage(relativePath);
      if (!remoteImage) return undefined;
      return { buffer: remoteImage, ext: ext === '.jpeg' ? '.jpg' : (ext as '.png' | '.jpg') };
    }

    const normalizedPath = relativePath.replace(/^\/+/, '');
    const withoutAssetsPrefix = normalizedPath.replace(/^assets\//, '');
    const filePath = path.resolve(ASSETS_DIR, withoutAssetsPrefix);
    if (!filePath.startsWith(ASSETS_DIR)) return undefined;
    try {
      if (!fs.existsSync(filePath)) return undefined;
      const buffer = fs.readFileSync(filePath);
      return { buffer, ext: ext === '.jpeg' ? '.jpg' : (ext as '.png' | '.jpg') };
    } catch {
      return undefined;
    }
  }

  private async fetchRemoteImage(url: string): Promise<Buffer | null> {
    return new Promise(resolve => {
      const req = https.get(url, res => {
        if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400 && res.headers.location) {
          res.resume();
          void this.fetchRemoteImage(res.headers.location).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', () => resolve(null));
      req.setTimeout(5000, () => req.destroy());
    });
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
