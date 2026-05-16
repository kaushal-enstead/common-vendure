import PDFDocument from 'pdfkit';
import type { NobrindeBudget } from '../entities/nobrinde-budgets';

export interface BrandingContext {
  storeName: string;
  storeAddress: string;
  supportEmail: string;
  billingEmail: string;
  replyToEmail: string;
  domain: string;
  privacyPolicyUrl: string;
  colors: {
    primary: string;
    secondary: string;
    foreground: string;
    background: string;
  };
  logo?: { buffer: Buffer; ext: '.png' | '.jpg' };
  defaultCurrency: string;
}

export interface BudgetPdfLine {
  ordem: number | null;
  name: string;
  sku: string;
  qtdd: number | null;
  preco_unit: number | null;
  desc: number | null;
  iva: number | null;
  total: number | null;
  image?: { buffer: Buffer; ext: '.png' | '.jpg' };
  currency: string;
}

export interface BuildBudgetPdfInput {
  budget: NobrindeBudget;
  lines: BudgetPdfLine[];
  branding: BrandingContext;
}

const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 110;
const FOOTER_HEIGHT = 60;
const ROW_BG_ALT = '#F7F7F8';
const BORDER_COLOR = '#E5E7EB';
const MUTED = '#6B7280';
const TABLE_WIDTH = 515;

const TABLE = {
  num: 26,
  product: 191,
  qty: 38,
  unit: 70,
  disc: 48,
  iva: 70,
  total: 78,
};

export function buildBudgetPdfBuffer(input: BuildBudgetPdfInput): Promise<Buffer> {
  const { budget, lines, branding } = input;
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, budget, branding);
    let y = PAGE_MARGIN + HEADER_HEIGHT + 20;

    y = drawDetailsBlocks(doc, budget, branding, y);
    y += 12;

    y = drawLinesTable(doc, lines, branding, y);
    y += 6;

    y = drawSummary(doc, budget, branding, y);

    if (budget.observacoes) {
      y = ensureSpace(doc, y, 80, branding, budget);
      y = drawObservations(doc, budget.observacoes, branding, y);
    }

    drawFootersOnAllPages(doc, branding);
    doc.end();
  });
}

function drawHeader(doc: PDFKit.PDFDocument, budget: NobrindeBudget, brand: BrandingContext): void {
  const { primary, background, foreground } = brand.colors;
  const W = doc.page.width;

  doc.save();
  doc.rect(0, 0, W, HEADER_HEIGHT + PAGE_MARGIN).fill(primary);
  doc.restore();

  const logoX = PAGE_MARGIN;
  const logoY = PAGE_MARGIN + 8;
  const logoW = 130;
  const logoH = 56;
  let logoRight = PAGE_MARGIN;
  if (brand.logo) {
    try {
      doc.image(brand.logo.buffer, logoX, logoY, { fit: [logoW, logoH], align: 'center', valign: 'center' });
      logoRight = logoX + logoW + 16;
    } catch {
      logoRight = PAGE_MARGIN;
    }
  }

  const safeStoreName = singleLine(brand.storeName);
  const safeStoreAddress = singleLine(brand.storeAddress);
  if (safeStoreName) {
    doc.save();
    doc.roundedRect(logoX, logoY + logoH + 6, logoW, 16, 3).fill(background);
    doc.restore();
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(foreground)
      .text(safeStoreName, logoX + 4, logoY + logoH + 10, {
        width: logoW - 8,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });
  }

  doc
    .fillColor(background)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('ORÇAMENTO', logoRight, PAGE_MARGIN + 8, { width: 240, lineBreak: false });

  if (safeStoreAddress) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(withAlpha(background, 0.85))
      .text(safeStoreAddress, logoRight, PAGE_MARGIN + 30, { width: 260, lineBreak: false, ellipsis: true });
  }

  const rightX = doc.page.width - PAGE_MARGIN - 220;
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(background)
    .text(`Nº ${budget.id_phc ?? '–'}`, rightX, PAGE_MARGIN + 10, { width: 220, align: 'right' });

  const metaLines = [
    budget.serie ? `Série ${budget.serie}` : '',
    budget.data_documento ? `Data: ${budget.data_documento}` : '',
  ].filter(Boolean);

  doc.font('Helvetica').fontSize(10).fillColor(withAlpha(background, 0.95));
  let metaY = PAGE_MARGIN + 34;
  for (const line of metaLines) {
    doc.text(singleLine(line), rightX, metaY, { width: 220, align: 'right', lineBreak: false, ellipsis: true });
    metaY += 13;
  }
}

function drawDetailsBlocks(
  doc: PDFKit.PDFDocument,
  budget: NobrindeBudget,
  brand: BrandingContext,
  startY: number,
): number {
  const { primary, foreground } = brand.colors;
  const colWidth = (doc.page.width - PAGE_MARGIN * 2 - 16) / 2;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + colWidth + 16;

  const renderBlock = (
    title: string,
    rows: Array<[string, string]>,
    x: number,
    y: number,
  ): number => {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(primary)
      .text(title.toUpperCase(), x, y, { characterSpacing: 1 });
    let cursor = y + 14;
    doc
      .moveTo(x, cursor - 4)
      .lineTo(x + colWidth, cursor - 4)
      .lineWidth(0.5)
      .stroke(BORDER_COLOR);
    cursor += 4;

    for (const [label, value] of rows) {
      const safeValue = value || '–';
      const labelHeight = doc.heightOfString(label, { width: 75 });
      const valueHeight = doc.heightOfString(safeValue, { width: colWidth - 80 });
      const rowHeight = Math.max(14, labelHeight, valueHeight);

      doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(label, x, cursor, { width: 75 });
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(foreground)
        .text(safeValue, x + 80, cursor, { width: colWidth - 80 });
      cursor += rowHeight + 2;
    }
    return cursor;
  };

  const clientRows: Array<[string, string]> = [
    ['Empresa', budget.empresa ?? ''],
    ['NIF', budget.nif ?? ''],
    ['Morada', budget.morada ?? ''],
    [
      'Localidade',
      [budget.c_postal, budget.localidade].filter(Boolean).join(' ') || '',
    ],
  ];

  const docRows: Array<[string, string]> = [
    ['Nº Doc.', budget.nr_doc_pv != null ? String(budget.nr_doc_pv) : ''],
    ['Entidade', budget.nr_entidade != null ? String(budget.nr_entidade) : ''],
    ['Cond. Pag.', budget.cond_pagamento ?? ''],
    ['Expedição', budget.data_expedicao ?? ''],
  ];

  const yLeft = renderBlock('Cliente', clientRows, leftX, startY);
  const yRight = renderBlock('Documento', docRows, rightX, startY);
  return Math.max(yLeft, yRight);
}

function drawTableHeader(doc: PDFKit.PDFDocument, brand: BrandingContext, y: number): number {
  const { primary, background } = brand.colors;
  const x = PAGE_MARGIN;
  const headerHeight = 22;

  doc.save();
  doc.rect(x, y, TABLE_WIDTH, headerHeight).fill(primary);
  doc.restore();

  const headers: Array<{ label: string; w: number; align: 'left' | 'right' | 'center' }> = [
    { label: '#', w: TABLE.num, align: 'center' },
    { label: 'Produto', w: TABLE.product, align: 'left' },
    { label: 'Qtd.', w: TABLE.qty, align: 'right' },
    { label: 'Preço Un.', w: TABLE.unit, align: 'right' },
    { label: 'Desc. %', w: TABLE.disc, align: 'right' },
    { label: 'IVA', w: TABLE.iva, align: 'right' },
    { label: 'Total', w: TABLE.total, align: 'right' },
  ];

  doc.font('Helvetica-Bold').fontSize(9).fillColor(background);
  let cx = x;
  for (const h of headers) {
    doc.text(h.label, cx + 6, y + 7, { width: h.w - 12, align: h.align, lineBreak: false });
    cx += h.w;
  }
  return y + headerHeight;
}

function drawLinesTable(
  doc: PDFKit.PDFDocument,
  lines: BudgetPdfLine[],
  brand: BrandingContext,
  startY: number,
): number {
  const { foreground, secondary } = brand.colors;
  let y = drawTableHeader(doc, brand, startY);

  if (lines.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(MUTED)
      .text('Sem linhas', PAGE_MARGIN + 8, y + 8);
    y += 30;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + TABLE_WIDTH, y)
      .lineWidth(0.5)
      .stroke(BORDER_COLOR);
    return y;
  }

  lines.forEach((line, idx) => {
    const rowHeight = 42;
    const remaining = doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT - y;
    if (remaining < rowHeight + 10) {
      doc.addPage();
      y = drawTableHeader(doc, brand, PAGE_MARGIN);
    }

    if (idx % 2 === 1) {
      doc.save();
      doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, rowHeight).fill(ROW_BG_ALT);
      doc.restore();
    }

    let cx = PAGE_MARGIN;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(foreground)
      .text(line.ordem != null ? String(line.ordem) : String(idx + 1), cx + 4, y + 14, {
        width: TABLE.num - 8,
        align: 'center',
      });
    cx += TABLE.num;

    const imageBoxX = cx + 6;
    const imageBoxY = y + 5;
    const imageSize = 32;
    if (line.image) {
      try {
        doc.image(line.image.buffer, imageBoxX, imageBoxY, {
          fit: [imageSize, imageSize],
          align: 'center',
          valign: 'center',
        });
      } catch {
        drawImagePlaceholder(doc, imageBoxX, imageBoxY, imageSize, secondary);
      }
    } else {
      drawImagePlaceholder(doc, imageBoxX, imageBoxY, imageSize, secondary);
    }

    const textX = imageBoxX + imageSize + 8;
    const textWidth = TABLE.product - (imageSize + 18);
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(foreground)
      .text(line.name, textX, y + 8, { width: textWidth, ellipsis: true, lineBreak: false });
    if (line.sku) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(MUTED)
        .text(line.sku, textX, y + 22, { width: textWidth, ellipsis: true, lineBreak: false });
    }
    cx += TABLE.product;

    const cells: Array<{ v: string; w: number }> = [
      { v: line.qtdd != null ? String(line.qtdd) : '–', w: TABLE.qty },
      { v: formatMoney(line.preco_unit, line.currency), w: TABLE.unit },
      { v: line.desc != null ? formatNumber(line.desc) : '–', w: TABLE.disc },
      { v: formatMoney(line.iva, line.currency), w: TABLE.iva },
      { v: formatMoney(line.total, line.currency), w: TABLE.total },
    ];
    doc.font('Helvetica').fontSize(9.5).fillColor(foreground);
    for (const cell of cells) {
      doc.text(cell.v, cx + 6, y + 14, { width: cell.w - 12, align: 'right' });
      cx += cell.w;
    }

    y += rowHeight;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + TABLE_WIDTH, y)
      .lineWidth(0.5)
      .stroke(BORDER_COLOR);
  });

  return y;
}

function drawImagePlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  doc.save();
  doc.roundedRect(x, y, size, size, 3).fillAndStroke(withAlpha(color, 0.1), withAlpha(color, 0.3));
  doc.restore();
}

function drawSummary(
  doc: PDFKit.PDFDocument,
  budget: NobrindeBudget,
  brand: BrandingContext,
  startY: number,
): number {
  const { primary, foreground } = brand.colors;
  const summaryWidth = 240;
  const x = PAGE_MARGIN + TABLE_WIDTH - summaryWidth;
  let y = ensureSpace(doc, startY + 12, 100, brand, budget);

  const subtotal = parseNumber(budget.total_liq);
  const ivaAmount = budget.iva ?? null;
  const total = budget.total ?? null;
  const currency = brand.defaultCurrency;

  const row = (label: string, value: string, opts: { bold?: boolean; color?: string } = {}) => {
    doc
      .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(opts.bold ? 11 : 10)
      .fillColor(opts.color ?? foreground);
    doc.text(label, x, y, { width: 130 });
    doc.text(value, x + 130, y, { width: summaryWidth - 130, align: 'right' });
    y += opts.bold ? 18 : 16;
  };

  row('Subtotal (líquido)', formatMoney(subtotal, currency));
  if (ivaAmount != null) {
    row(
      budget.taxa_iva != null ? `IVA (${formatNumber(budget.taxa_iva, 0)}%)` : 'IVA',
      formatMoney(ivaAmount, currency),
    );
  }

  doc
    .moveTo(x, y)
    .lineTo(x + summaryWidth, y)
    .lineWidth(0.7)
    .stroke(primary);
  y += 8;

  row('TOTAL', formatMoney(total, currency), { bold: true, color: primary });

  return y;
}

function drawObservations(
  doc: PDFKit.PDFDocument,
  text: string,
  brand: BrandingContext,
  startY: number,
): number {
  const { primary, foreground } = brand.colors;
  const x = PAGE_MARGIN;
  const w = doc.page.width - PAGE_MARGIN * 2;
  let y = startY + 12;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text('OBSERVAÇÕES', x, y, {
    characterSpacing: 1,
  });
  y += 14;
  doc
    .moveTo(x, y - 4)
    .lineTo(x + w, y - 4)
    .lineWidth(0.5)
    .stroke(BORDER_COLOR);
  const content = text.trim();
  doc.font('Helvetica').fontSize(9.5).fillColor(foreground).text(content, x, y, { width: w });
  return y + doc.heightOfString(content, { width: w }) + 4;
}

function drawFootersOnAllPages(doc: PDFKit.PDFDocument, brand: BrandingContext): void {
  const { primary } = brand.colors;
  const range = doc.bufferedPageRange();
  const total = range.count;

  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const W = doc.page.width;
    const H = doc.page.height;
    const y = H - FOOTER_HEIGHT;

    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(W - PAGE_MARGIN, y)
      .lineWidth(0.5)
      .stroke(BORDER_COLOR);

    const contactBits = [
      brand.storeName,
      brand.domain,
      brand.supportEmail,
      brand.billingEmail,
      brand.privacyPolicyUrl,
    ].filter(Boolean);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(singleLine(contactBits.join(' · ')), PAGE_MARGIN, y + 10, {
        width: W - PAGE_MARGIN * 2 - 80,
        height: 10,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(primary)
      .text('Obrigado pela sua preferência.', PAGE_MARGIN, y + 28, {
        width: W - PAGE_MARGIN * 2 - 80,
        height: 10,
        lineBreak: false,
      });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(`Pág. ${i + 1} / ${total}`, W - PAGE_MARGIN - 80, y + 28, {
        width: 80,
        align: 'right',
      });
  }
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  y: number,
  needed: number,
  brand: BrandingContext,
  _budget: NobrindeBudget,
): number {
  const limit = doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT;
  if (y + needed > limit) {
    doc.addPage();
    drawHeader(doc, _budget, brand);
    return PAGE_MARGIN + HEADER_HEIGHT + 20;
  }
  return y;
}

function formatNumber(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return '–';
  return Number(n).toLocaleString('pt-PT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(n: number | null | undefined, currency: string): string {
  if (n == null || Number.isNaN(n)) return '–';
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(Number(n));
  } catch {
    return `${formatNumber(n)} ${currency ?? ''}`.trim();
  }
}

function parseNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = value.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const blendChannel = (c: number) => Math.round(c * alpha + 255 * (1 - alpha));
  const out = [blendChannel(r), blendChannel(g), blendChannel(b)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${out}`;
}

function singleLine(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}
