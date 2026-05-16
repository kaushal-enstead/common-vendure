import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { CUSTOMER_SYNC_PLUGIN_OPTIONS, DEFAULT_SYNC_CRON } from './constants';
import { PluginInitOptions } from './types';
import { SyncService } from './services/sync-service';
import { SyncTable } from './entities/sync-table';
import { syncCustomerTask } from './scheduler/sync-customer';
import { syncNobrindeSaleUsersTask } from './scheduler/sync-nobrinde-sale-users';
import { syncNobrindeChannelsTask } from './scheduler/sync-nobrinde-channels';
import { syncNobrindeBudgetTask } from './scheduler/sync-nobrinde-budget';
import { syncNobrindeOrderTask } from './scheduler/sync-nobrinde-order';
import { syncFacetsTask } from './scheduler/sync-facets';
import { syncCollectionsTask } from './scheduler/sync-collections';
import { syncSimpleProductsTask } from './scheduler/sync-simple-products';
import { syncVariableProductsTask } from './scheduler/sync-variable-products';
import { syncVariantPricesTask } from './scheduler/sync-variant-prices';
import { syncVariantStocksTask } from './scheduler/sync-variant-stocks';
import { apiExtensions } from './api/api-extensions';
import { SyncControlResolver } from './api/sync-control.resolver';
import { GroupedParentResolver } from './api/grouped-parent.resolver';
import { SyncControlService } from './services/sync-control.service';
import { SyncRunnerService } from './services/sync-runner.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: CUSTOMER_SYNC_PLUGIN_OPTIONS, useFactory: () => SyncPlugin.options },
    SyncService,
    SyncControlService,
    SyncRunnerService,
    GroupedParentResolver,
    // CustomerEventListener,
  ],
  adminApiExtensions: {
    schema: apiExtensions,
    resolvers: [SyncControlResolver, GroupedParentResolver],
  },
  configuration: config => {
    config.customFields.Channel.push({
      name: 'nobrinde_channel_id',
      type: 'int',
      label: [
        { languageCode: LanguageCode.en, value: 'Nobrinde Channel ID' },
        { languageCode: LanguageCode.pt, value: 'ID do Canal Nobrinde' },
      ],
      ui: { component: 'nobrinde-channel-id-select' },
    });

    config.customFields.Asset.push({
      name: 'external_id',
      type: 'string',
      length: 255,
      nullable: true,
      unique: true,
      public: false,
      readonly: true,
      label: [
        { languageCode: LanguageCode.en, value: 'External sync asset id' },
        { languageCode: LanguageCode.pt, value: 'ID externo do asset (sync)' },
      ],
    });

    config.customFields.Customer.push(
      {
        name: 'mappingId',
        type: 'int',
        defaultValue: 0,
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Mapping ID' },
          { languageCode: LanguageCode.pt, value: 'ID de Mapeamento' },
        ],
      },
      {
        name: 'nr_entidade',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Client Number' },
          { languageCode: LanguageCode.pt, value: 'Número de Cliente' },
        ],
      },
      {
        name: 'empresa',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Client Name' },
          { languageCode: LanguageCode.pt, value: 'Nome do Cliente' },
        ],
      },
      {
        name: 'nif',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Tax ID' },
          { languageCode: LanguageCode.pt, value: 'ID de Imposto' },
        ],
      },
      {
        name: 'estabelecimento',
        type: 'int',
        defaultValue: 0,
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Branch Number' },
          { languageCode: LanguageCode.pt, value: 'Número de Filial' },
        ],
      },
      {
        name: 'telemovel',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Mobile Phone' },
          { languageCode: LanguageCode.pt, value: 'Telefone Móvel' },
        ],
      },
      {
        name: 'tipo',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Customer Type' },
          { languageCode: LanguageCode.pt, value: 'Tipo de Cliente' },
        ],
      },
      {
        name: 'segmento',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Segment' },
          { languageCode: LanguageCode.pt, value: 'Segmento' },
        ],
      },
      {
        name: 'acesso_web',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Web Access Type' },
          { languageCode: LanguageCode.pt, value: 'Tipo de Acesso Web' },
        ],
      },
      {
        name: 'nr_tipo_reg',
        type: 'string',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Record Type' },
          { languageCode: LanguageCode.pt, value: 'Tipo de Registro' },
        ],
      },

      {
        name: 'site_associado',
        type: 'string',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Associated Site' },
          { languageCode: LanguageCode.pt, value: 'Site Associado' },
        ],
      },
      {
        name: 'is_active',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Active' },
          { languageCode: LanguageCode.pt, value: 'Ativo' },
        ],
      },
      {
        name: 'id_vendedor',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Salesperson ID' },
          { languageCode: LanguageCode.pt, value: 'ID do Vendedor' },
        ],
      },
      {
        name: 'desc_cliente',
        type: 'int',
        // readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Discount Product' },
          { languageCode: LanguageCode.pt, value: 'Desconto do Produto' },
        ],
      },
      {
        name: 'desc_prodint',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Discount Internal Product' },
          { languageCode: LanguageCode.pt, value: 'Desconto do Produto Interno' },
        ],
      },
      {
        name: 'desc_imp',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Discount Tax' },
          { languageCode: LanguageCode.pt, value: 'Desconto de Imposto' },
        ],
      },
      {
        name: 'cond_pagamento',
        type: 'string',
        defaultValue: '',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Payment Terms' },
          { languageCode: LanguageCode.pt, value: 'Condições de Pagamento' },
        ],
      },
      {
        name: 'max_dias_credito',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Max Credit Days' },
          { languageCode: LanguageCode.pt, value: 'Máximo de Dias de Crédito' },
        ],
      },
      {
        name: 'plafond_credito',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Credit Limit' },
          { languageCode: LanguageCode.pt, value: 'Limite de Crédito' },
        ],
      },
      {
        name: 'saldo_em_aberto',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Outstanding Balance' },
          { languageCode: LanguageCode.pt, value: 'Saldo Devedor' },
        ],
      },
      {
        name: 'online_last_indexed_status',
        type: 'int',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Online Last Indexed Status' },
          { languageCode: LanguageCode.pt, value: 'Status do Último Índice Online' },
        ],
      },
      {
        name: 'online_last_indexed_at_date',
        type: 'datetime',
        readonly: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Online Last Indexed At Date' },
          { languageCode: LanguageCode.pt, value: 'Data do Último Índice Online' },
        ],
      },
    );

    config.customFields.Product.push(
      {
        name: 'main_sku',
        type: 'string',
        unique: true,
        label: [
          { languageCode: LanguageCode.en, value: 'SKU' },
          { languageCode: LanguageCode.pt, value: 'SKU' },
        ],
      },
      {
        name: 'sku_mba',
        type: 'string',
        unique: true,
        label: [
          { languageCode: LanguageCode.en, value: 'SKU (MBA)' },
          { languageCode: LanguageCode.pt, value: 'SKU' },
        ],
      },
      {
        name: 'grouped_child_skus',
        type: 'string',
        list: true,
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Grouped child SKUs' },
          { languageCode: LanguageCode.pt, value: 'SKUs filhos (agrupado)' },
        ],
        ui: { tab: 'Grouping' },
      },
      {
        name: 'external_product_type',
        type: 'string',
        nullable: true,
        public: false,
        readonly: true,
        label: [
          { languageCode: LanguageCode.en, value: 'External product type' },
          { languageCode: LanguageCode.pt, value: 'Tipo de produto (externo)' },
        ],
        ui: { tab: 'Grouping' },
      },
      {
        name: 'seo_metadata',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'SEO Metadata' },
          { languageCode: LanguageCode.pt, value: 'Metadados SEO' },
        ],
        ui: {
          component: 'seo-metadata-editor',
          tab: 'SEO',
        },
      },
      {
        name: 'llm_metadata',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'LLM Metadata' },
          { languageCode: LanguageCode.pt, value: 'Metadados LLM' },
        ],
        ui: {
          component: 'llm-metadata-editor',
          tab: 'SEO',
        },
      },
      {
        name: 'material',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Material' },
          { languageCode: LanguageCode.pt, value: 'Material' },
        ],
      },
      {
        name: 'is_printable',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Printable' },
          { languageCode: LanguageCode.pt, value: 'É Imprimível' },
        ],
      },
      {
        name: 'printings',
        type: 'text',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Printings' },
          { languageCode: LanguageCode.pt, value: 'Impressões' },
        ],
        ui: {
          component: 'printings-editor',
          tab: 'Printings',
        },
      },
      {
        name: 'measurements',
        type: 'struct',
        fields: [
          { name: 'capacity', type: 'string' },
          { name: 'coating_weight', type: 'float' },
          { name: 'coating_weight_unit', type: 'string' },
          { name: 'diameter', type: 'string' },
          { name: 'diameter_unit', type: 'string' },
          { name: 'gross_weight', type: 'float' },
          { name: 'height', type: 'string' },
          { name: 'height_unit', type: 'string' },
          { name: 'length', type: 'string' },
          { name: 'length_unit', type: 'string' },
          { name: 'liquid_volume', type: 'string' },
          { name: 'liquid_volume_unit', type: 'string' },
          { name: 'net_weight', type: 'string' },
          { name: 'size_combined', type: 'string' },
          { name: 'size_combined_unit', type: 'string' },
          { name: 'volume', type: 'string' },
          { name: 'volume_unit', type: 'string' },
          { name: 'weight_unit', type: 'string' },
          { name: 'width', type: 'string' },
          { name: 'width_unit', type: 'string' },
        ],
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Measurements' },
          { languageCode: LanguageCode.pt, value: 'Medidas' },
        ],
        ui: {
          component: 'measurements-editor',
          tab: 'Measurements',
        },
      },
      {
        name: 'packaging',
        type: 'text',
        // list: true,
        // fields: [
        //   { name: 'blank_product_individual_packing', type: 'boolean' },
        //   { name: 'description', type: 'text' },
        //   { name: 'dimensions', type: 'string' },
        //   { name: 'gross_weight', type: 'float' },
        //   { name: 'has_individual_packaging', type: 'boolean' },
        //   { name: 'name', type: 'string' },
        //   { name: 'net_weight', type: 'float' },
        //   { name: 'package_level', type: 'int' },
        //   { name: 'package_level_name', type: 'string' },
        //   { name: 'package_type', type: 'text' },
        //   { name: 'packaging_after_printing', type: 'string' },
        //   { name: 'quantity', type: 'int' },
        //   { name: 'volume', type: 'float' },
        //   { name: 'volume_unit', type: 'string' },
        //   { name: 'weight_unit', type: 'string' },
        // ],
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Packaging' },
          { languageCode: LanguageCode.pt, value: 'Embalagem' },
        ],
        ui: {
          tab: 'Packaging',
          component: 'packaging-editor',
        },
      },
      {
        name: 'digital_assets',
        type: 'struct',
        list: true,
        fields: [
          { name: 'url', type: 'string' },
          { name: 'is_confidencial', type: 'boolean' },
          { name: 'type', type: 'string' },
          { name: 'subtype', type: 'text' },
        ],
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Digital assets' },
          { languageCode: LanguageCode.pt, value: 'Ativos digitais' },
        ],
        ui: {
          tab: 'Digital assets',
          component: 'digital-assets-editor',
        },
      },
    );

    config.customFields.ProductVariant.push(
      {
        name: 'item_code',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Item Code' },
          { languageCode: LanguageCode.pt, value: 'Código de Item' },
        ],
        readonly: true,
        ui: { tab: 'Codes' },
      },
      {
        name: 'ean_code',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'EAN Code' },
          { languageCode: LanguageCode.pt, value: 'EAN Code' },
        ],
        readonly: true,
        ui: { tab: 'Codes' },
      },
      {
        name: 'barcode',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Barcode' },
          { languageCode: LanguageCode.pt, value: 'Código de Barras' },
        ],
        readonly: true,
        ui: { tab: 'Codes' },
      },
      {
        name: 'hs_code',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'HS Code' },
          { languageCode: LanguageCode.pt, value: 'Código HS' },
        ],
        readonly: true,
        ui: { tab: 'Codes' },
      },
      {
        name: 'intrastat_code',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Intrastat Code' },
          { languageCode: LanguageCode.pt, value: 'Código Intrastat' },
        ],
        readonly: true,
        ui: { tab: 'Codes' },
      },
      {
        name: 'is_new',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is New' },
          { languageCode: LanguageCode.pt, value: 'É Novo' },
        ],
        readonly: true,
      },
      {
        name: 'is_best_seller',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Best Seller' },
          { languageCode: LanguageCode.pt, value: 'É Melhor Vendedor' },
        ],
        readonly: true,
      },
      {
        name: 'is_stockoff',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Stockoff' },
          { languageCode: LanguageCode.pt, value: 'É Estoque Esgotado' },
        ],
        readonly: true,
      },
      {
        name: 'date_release',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Date Release' },
          { languageCode: LanguageCode.pt, value: 'Data de Liberação' },
        ],
        readonly: true,
      },
      {
        name: 'date_new_end',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Date New End' },
          { languageCode: LanguageCode.pt, value: 'Data de Fim da Nova' },
        ],
        readonly: true,
      },
      {
        name: 'is_promotion',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Promotion' },
          { languageCode: LanguageCode.pt, value: 'É Promoção' },
        ],
        readonly: true,
        ui: { tab: 'Promotion' },
      },
      {
        name: 'promotion_value',
        type: 'int',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Promotion Value' },
          { languageCode: LanguageCode.pt, value: 'Valor da Promoção' },
        ],
        readonly: true,
        ui: { tab: 'Promotion' },
      },
      {
        name: 'promotion_percentage',
        type: 'int',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Promotion Percentage' },
          { languageCode: LanguageCode.pt, value: 'Percentagem da Promoção' },
        ],
        readonly: true,
        ui: { tab: 'Promotion' },
      },
      {
        name: 'promotion_date_start',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Promotion Date Start' },
          { languageCode: LanguageCode.pt, value: 'Data de Início da Promoção' },
        ],
        readonly: true,
        ui: { tab: 'Promotion' },
      },
      {
        name: 'promotion_date_end',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Promotion Date End' },
          { languageCode: LanguageCode.pt, value: 'Data de Fim da Promoção' },
        ],
        readonly: true,
        ui: { tab: 'Promotion' },
      },

      {
        name: 'is_featured',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Featured' },
          { languageCode: LanguageCode.pt, value: 'É Destacado' },
        ],
        readonly: true,
        ui: { tab: 'Featured' },
      },
      {
        name: 'date_featured_start',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Date Featured Start' },
          { languageCode: LanguageCode.pt, value: 'Data de Início do Destacado' },
        ],
        readonly: true,
        ui: { tab: 'Featured' },
      },
      {
        name: 'date_featured_end',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Date Featured End' },
          { languageCode: LanguageCode.pt, value: 'Data de Fim do Destacado' },
        ],
        readonly: true,
        ui: { tab: 'Featured' },
      },

      {
        name: 'is_discontinued',
        type: 'boolean',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Is Discontinued' },
          { languageCode: LanguageCode.pt, value: 'É Discontinuado' },
        ],
        readonly: true,
        ui: { tab: 'Discontinued' },
      },
      {
        name: 'date_discontinued',
        type: 'datetime',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Date Discontinued' },
          { languageCode: LanguageCode.pt, value: 'Data de Discontinuação' },
        ],
        readonly: true,
        ui: { tab: 'Discontinued' },
      },
    );

    config.customFields.Collection.push(
      // ── General tab ────────────────────────────────────────────────────────
      {
        name: 'categoryType',
        type: 'string',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Category Type' },
          { languageCode: LanguageCode.pt, value: 'Tipo de Categoria' },
        ],
        ui: { tab: 'General' },
      },
      {
        name: 'globalMetadata',
        type: 'struct',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Global Metadata' },
          { languageCode: LanguageCode.pt, value: 'Metadados Globais' },
        ],
        fields: [
          {
            name: 'google_id',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Google ID' }],
          },
          {
            name: 'wiki_id',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Wikidata ID' }],
          },
          {
            name: 'sameAs',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'sameAs URL' }],
          },
        ],
        ui: { tab: 'General' },
      },
      // ── Content tab ────────────────────────────────────────────────────────
      {
        name: 'pageContent',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Page Content' },
          { languageCode: LanguageCode.pt, value: 'Conteúdo da Página' },
        ],
        ui: { component: 'page-content-editor', tab: 'Page Content', fullWidth: true },
      },
      {
        name: 'richContent',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Rich Content' },
          { languageCode: LanguageCode.pt, value: 'Conteúdo Rico' },
        ],
        ui: { component: 'rich-content-editor', tab: 'Rich Content', fullWidth: true },
      },
      {
        name: 'faqs',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'FAQs' },
          { languageCode: LanguageCode.pt, value: 'FAQs' },
        ],
        ui: { component: 'faqs-editor', tab: 'Faq', fullWidth: true },
      },
      // ── SEO tab ────────────────────────────────────────────────────────────
      {
        name: 'seoMetadata',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'SEO Metadata' },
          { languageCode: LanguageCode.pt, value: 'Metadados SEO' },
        ],
        ui: { component: 'collection-seo-editor', tab: 'SEO', fullWidth: true },
      },
      {
        name: 'semanticKnowledge',
        type: 'localeText',
        nullable: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Semantic Knowledge' },
          { languageCode: LanguageCode.pt, value: 'Conhecimento Semântico' },
        ],
        ui: { component: 'semantic-knowledge-editor', tab: 'Semantic', fullWidth: true },
      },
    );

    config.schedulerOptions.tasks.push(
      syncCustomerTask.configure({
        params: {
          tableName: 'customers',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VENTIDADES')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VENTIDADES')?.scheduleCron || DEFAULT_SYNC_CRON,
        // schedule: '*/5 * * * * *', // every 5 seconds
      }),
      syncNobrindeSaleUsersTask.configure({
        params: {
          tableName: 'nobrinde_sale_users',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VVENDEDORES')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VVENDEDORES')?.scheduleCron || DEFAULT_SYNC_CRON,
        // schedule: '*/5 * * * * *', // every 5 seconds
      }),
      syncNobrindeChannelsTask.configure({
        params: {
          tableName: 'nobrinde_channels',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'channels')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'channels')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncNobrindeBudgetTask.configure({
        params: {
          tableName: 'nobrinde_budgets',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VORCAMENTOS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VORCAMENTOS')?.scheduleCron || DEFAULT_SYNC_CRON,
        // schedule: '*/5 * * * * *', // every 5 seconds
      }),
      syncNobrindeOrderTask.configure({
        params: {
          tableName: 'nobrinde_orders',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VENCOMENDAS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VENCOMENDAS')?.scheduleCron || DEFAULT_SYNC_CRON,
        // schedule: '*/5 * * * * *', // every 5 seconds
      }),
      syncFacetsTask.configure({
        params: {
          tableName: 'facets',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VTAGS')!,
        },
        schedule: SyncPlugin.options.tables.find(t => t.name === 'VTAGS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncCollectionsTask.configure({
        params: {
          tableName: 'collections',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VLABELS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VLABELS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncVariableProductsTask.configure({
        params: {
          tableName: 'products-variable',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncSimpleProductsTask.configure({
        params: {
          tableName: 'products-simple',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncVariantPricesTask.configure({
        params: {
          tableName: 'variant-prices',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
      syncVariantStocksTask.configure({
        params: {
          tableName: 'variant-stocks',
          tableConfig: SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')!,
        },
        schedule:
          SyncPlugin.options.tables.find(t => t.name === 'VPRODUCTS')?.scheduleCron || DEFAULT_SYNC_CRON,
      }),
    );

    return config;
  },
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
  entities: [SyncTable],
})
export class SyncPlugin {
  static options: PluginInitOptions;

  constructor() {}

  async onModuleInit() {}

  static init(options: PluginInitOptions): Type<SyncPlugin> {
    this.options = options;
    // this.options = {
    //   ...options,
    //   tables: options.tables.map(table => ({
    //     ...table,
    //     batchSize: table.batchSize || DEFAULT_BATCH_SIZE,
    //     scheduleIntervalMs: table.scheduleIntervalMs || DEFAULT_SYNC_CRON,
    //   })),
    // };
    return SyncPlugin;
  }
}
