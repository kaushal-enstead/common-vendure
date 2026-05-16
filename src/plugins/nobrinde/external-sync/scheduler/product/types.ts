export type ImageRow = {
  url: string;
  url_highress: string;
  type: string;
  subtype: string;
  cor: string;
};

export type CollectionImageRow = {
  icon: string;
  url: string;
};

export type LanguageRow = {
  pt: string;
  es: string;
  en: string;
  fr: string;
};

export type LLMMetadataRow = { keywords: LanguageRow; useCases: string[] };

export type SeoMetadataRow = {
  meta: { description: LanguageRow; title: LanguageRow };
};

export type DescriptionRow = {
  blocks: { type_field: string; conteudo: LanguageRow }[];
};

export type PriceRow = {
  price: number;
  quantityStart: number;
  quantityEnd: number;
};

export type ProductCategoryRow = {
  id: number;
  name: string;
};

export type ProductTagRow = {
  tag_id: number;
  tag_value_id: number;
  tag_value_code: string;
  source_rule_id: number;
};

/** `VPRODUCTS.product_relations_json` for `product_type === 'grouped'` */
export type ProductRelationsJson = {
  children_skus?: string[] | null;
  alternatives?: unknown;
  bundle?: unknown;
  crossselling?: unknown;
  grouped_variants_count?: number;
  has_variants?: boolean;
  is_parent?: boolean;
  parent_sku?: string | null;
  related?: unknown;
  upselling?: unknown;
  variant_group_sku?: string | null;
};

export type ProductRow = {
  id: number | string;
  supplier_id: number | string;
  product_id: number | string;
  sku: string;
  sku_variant: string;
  itemcode: string;
  min_quantity: number;
  prices: PriceRow[];
  has_stock: boolean | number | string | null;
  stocks: number | string | null;
  stock_date_created: Date | string | null;
  stock_date_updated: Date | string | null;
  sku_mba: string;
  name_pt: string;
  name_es: string;
  name_en: string;
  name_fr: string;
  //   translations: {
  //     languageCode: LanguageCode;
  //     name: string;
  //   }[];
  canal_json: string;
  description_json: DescriptionRow | string;
  digital_passport_json: string;
  seo_metadata_json: SeoMetadataRow | string;
  llm_metadata_json: LLMMetadataRow | string;
  product_type: string;
  snc: string;
  delivery_time: string;
  type_for_inventory: string;
  qty_of_sales_nobrinde: number;
  categories_id_json: string | { mba_categories: ProductCategoryRow[] };
  labels_id_json: string;
  tags_id_json: string | { last_updated: string; tags: ProductTagRow[] };
  vat: number;
  ean_code: string;
  barcode: string;
  hs_code: string;
  intrastat_code: string;
  prod_variant_config_json: string;
  img_json: ImageRow[] | string;
  digital_assets_id_json: string;
  color_pt: string;
  color_es: string;
  color_en: string;
  color_fr: string;
  color_code: string;
  color_id_json: string;
  size_pt: string;
  size_es: string;
  size_en: string;
  size_fr: string;
  size_chart_json: string;
  material_json: null | LanguageRow | string;
  composition_json: LanguageRow | string;
  is_printable: boolean;
  printings_json: string;
  product_relations_json: string;
  is_custom_order: boolean;
  prod_custom_fields_json: string;
  measurements_json: string;
  packaging_json: string;
  is_promotion: boolean;
  promotion_value: number;
  promotion_percentage: number;
  promotion_date_start: string;
  promotion_date_end: string;
  is_active: boolean;
  is_visible: boolean;
  is_new: boolean;
  date_release: string;
  date_new_end: string;
  is_best_seller: boolean;
  is_featured: boolean;
  date_featured_start: string;
  date_featured_end: string;
  is_stockoff: boolean;
  is_discontinued: boolean;
  date_discontinued: string;
  date_created: Date;
  date_updated: Date;
  variants: ProductRow[];
};
