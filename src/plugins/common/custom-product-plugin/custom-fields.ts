import { CustomFields, LanguageCode, Product } from '@vendure/core';

// TAB "Marketing"
export const marketingFields: Exclude<CustomFields['Product'], undefined> = [
  {
    name: 'cross_sell_products',
    type: 'relation',
    entity: Product,
    label: [
      { languageCode: LanguageCode.en, value: 'Cross Sell Products' },
      { languageCode: LanguageCode.pt, value: 'Produtos de Venda Cruzada' },
      { languageCode: LanguageCode.pt_PT, value: 'Produtos de Venda Cruzada' },
    ],
    ui: { tab: 'Marketting', component: 'product-multi-form-input' },
    list: true,
  },
  {
    name: 'up_sell_products',
    type: 'relation',
    entity: Product,
    label: [
      { languageCode: LanguageCode.en, value: 'Up Sell Products' },
      { languageCode: LanguageCode.pt, value: 'Produtos de Venda Superior' },
      { languageCode: LanguageCode.pt_PT, value: 'Produtos de Venda Superior' },
    ],
    ui: { tab: 'Marketting', component: 'product-multi-form-input' },
    list: true,
  },
  {
    name: 'seo_tag',
    type: 'localeString',
    label: [
      { languageCode: LanguageCode.en, value: 'SEO Tag' },
      { languageCode: LanguageCode.pt, value: 'Tag SEO' },
      { languageCode: LanguageCode.pt_PT, value: 'Tag SEO' },
    ],
    ui: { tab: 'Marketting' },
    description: [
      { languageCode: LanguageCode.en, value: 'Enter a single word tag' },
      { languageCode: LanguageCode.pt, value: 'Insira uma tag de palavra única' },
      { languageCode: LanguageCode.pt_PT, value: 'Insira uma tag de palavra única' },
    ],
  },
  {
    name: 'seo_description',
    type: 'localeString',
    label: [
      { languageCode: LanguageCode.en, value: 'SEO Description' },
      { languageCode: LanguageCode.pt, value: 'Descrição SEO' },
      { languageCode: LanguageCode.pt_PT, value: 'Descrição SEO' },
    ],
    ui: { tab: 'Marketting' },
    description: [
      { languageCode: LanguageCode.en, value: 'Separate multiple with commas' },
      { languageCode: LanguageCode.pt, value: 'Separe várias com vírgulas' },
      { languageCode: LanguageCode.pt_PT, value: 'Separe várias com vírgulas' },
    ],
  },
];

// TAB "Per Unit"
export const perUnitFields: Exclude<CustomFields['Product'], undefined> = [
  {
    name: 'unit_type',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Unit Type' },
      { languageCode: LanguageCode.pt, value: 'Tipo de Unidade' },
      { languageCode: LanguageCode.pt_PT, value: 'Tipo de Unidade' },
    ],
    ui: { tab: 'Per Unit' },
    options: [
      {
        value: 'g',
        label: [
          { languageCode: LanguageCode.en, value: 'Grams (g)' },
          { languageCode: LanguageCode.pt, value: 'Gramas (g)' },
          { languageCode: LanguageCode.pt_PT, value: 'Gramas (g)' },
        ],
      },
      {
        value: 'cm',
        label: [
          { languageCode: LanguageCode.en, value: 'Centimeters (cm)' },
          { languageCode: LanguageCode.pt, value: 'Centímetros (cm)' },
          { languageCode: LanguageCode.pt_PT, value: 'Centímetros (cm)' },
        ],
      },
      {
        value: 'ml',
        label: [
          { languageCode: LanguageCode.en, value: 'Milliliters (ml)' },
          { languageCode: LanguageCode.pt, value: 'Mililitros (ml)' },
          { languageCode: LanguageCode.pt_PT, value: 'Mililitros (ml)' },
        ],
      },
    ],
    nullable: true,
  },
  {
    name: 'product_per_unit',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'Per Unit Product?' },
      { languageCode: LanguageCode.pt, value: 'Produto por Unidade?' },
      { languageCode: LanguageCode.pt_PT, value: 'Produto por Unidade?' },
    ],
    ui: { tab: 'Per Unit' },
  },
];

// TAB "Bundle"
export const bundleFields: Exclude<CustomFields['Product'], undefined> = [
  {
    name: 'variantIds',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Variant IDs' },
      { languageCode: LanguageCode.pt, value: 'IDs das Variantes' },
      { languageCode: LanguageCode.pt_PT, value: 'IDs das Variantes' },
    ],
    list: true,
    public: true,
    readonly: true,
    ui: { tab: 'Bundle' },
  },
  {
    name: 'bundleId',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Bundle ID' },
      { languageCode: LanguageCode.pt, value: 'ID do Conjunto (Bundle)' },
      { languageCode: LanguageCode.pt_PT, value: 'ID do Conjunto (Bundle)' },
    ],
    public: true,
    readonly: true,
    ui: { tab: 'Bundle' },
  },
  {
    name: 'bundlePrice',
    type: 'float',
    label: [
      { languageCode: LanguageCode.en, value: 'Bundle Price' },
      { languageCode: LanguageCode.pt, value: 'Preço do Conjunto (Bundle)' },
      { languageCode: LanguageCode.pt_PT, value: 'Preço do Conjunto (Bundle)' },
    ],
    public: true,
    readonly: true,
    ui: { tab: 'Bundle' },
  },
  {
    name: 'isBundle',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'Is Bundle?' },
      { languageCode: LanguageCode.pt, value: 'É Conjunto (Bundle)?' },
      { languageCode: LanguageCode.pt_PT, value: 'É Conjunto (Bundle)?' },
    ],
    public: true,
    readonly: true,
    ui: { tab: 'Bundle' },
  },
];

export const customProductFields: Exclude<CustomFields['Product'], undefined> = [
  {
    name: 'newProduct',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'New Product' },
      { languageCode: LanguageCode.pt, value: 'Produto Novo' },
      { languageCode: LanguageCode.pt_PT, value: 'Produto Novo' },
    ],
    ui: { tab: 'General' },
  },
  {
    name: 'featuredProduct',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'Featured Product' },
      { languageCode: LanguageCode.pt, value: 'Produto em Destaque' },
      { languageCode: LanguageCode.pt_PT, value: 'Produto em Destaque' },
    ],
    ui: { tab: 'General' },
  },
  ...marketingFields,
  ...perUnitFields,
];
