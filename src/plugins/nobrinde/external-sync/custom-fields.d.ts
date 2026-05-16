import '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomCustomerFields {
    /** Unique mapping identifier for integrations or sync */
    mappingId: number; // nr_cliente

    /** Internal or external client reference number */
    client_number: number; // nr_entidade

    /** Company or business name */
    company_name: string; // empresa

    /** Tax Identification Number (Portugal: NIF) */
    tax_id: string; // nif

    /** Establishment or branch identifier */
    branch_number: string; // estabelecimento

    /**
     * address
     * 1. morada
     * 2. c_postal
     * 3. localidade
     * 4. pais
     */

    /** Mobile phone number */
    mobile_phone: string; // telemovel

    /** Customer type (e.g. direct sale, internal, entity) */
    customer_type: string; // tipo

    /** TODO: Customer or market segment */
    segment: string; // segemento

    /** TODO:: Web access type (e.g. internal/external) */
    acesso_web: string; // acesso_web

    /** Internal record type or classification */
    nr_tipo_reg: number; // nr_tipo_reg

    /** Associated website or branch ID */
    associated_site: number; // site_associado

    /** Active status */
    is_active: number; // ativo

    /** TODO: Associated channel */
    associated_channel: number; // site_associado

    /** Identifier for the assigned salesperson or representative */
    salesperson_id: number; // id_vendedor

    /** Customer Product discount percentage */
    discount_product: number; // desc_cliente

    /** Internal product discount percentage */
    discount_internal_product: number; // desc_prodint

    /** Printing service discount */
    discount_printing_service: number; // desc_imp

    /** Payment condition or method (e.g. 30 days, advance) */
    payment_terms: string; //cond_pagamento

    /** Maximum number of credit days allowed */
    max_credit_days: number; // max_dias_credito

    /** Credit limit (maximum credit amount allowed) */
    credit_limit: number; // plafond_credito

    /** Current outstanding balance amount */
    outstanding_balance: number; // saldo_em_aberto
  }

  interface CustomCollectionFields {
    categoryType: string;
    /** Struct field: { google_id, wiki_id, sameAs } — Vendure generates UI automatically */
    globalMetadata: { google_id: string; wiki_id: string; sameAs: string };
    /** Locale-specific JSON string storing { title, intro, desc } */
    pageContent: string;
    /** Locale-specific JSON string storing { m_title, m_desc } */
    seoMetadata: string;
    /** Locale-specific JSON string storing { keywords, synonyms, audience, use_cases } */
    semanticKnowledge: string;
    /** Locale-specific JSON string storing { takeaways, guide, pros_cons, comp_table, related } */
    richContent: string;
    /** Locale-specific JSON string storing Array<{ question, answer }> */
    faqs: string;
  }

  interface CustomProductFields {
    sku: string;
    seo_metadata: string;
    llm_metadata: string;
    is_printable: boolean;
    printings: {
      handling_costs: {
        handling_cost: number;
        handling_cost_code: string;
        has_handling: boolean;
      };
      included_services: {
        has_included_1_color_printing: boolean;
        has_included_full_printing: boolean;
        has_included_laser_printing: boolean;
        has_included_uv_printing: boolean;
        included_printings_json: string;
      };
      printing_capabilities: {
        has_marking: boolean;
        print_codes: string[];
        printing_hard: boolean;
      };
    };
    measurements: {
      capacity: string;
      coating_weight: number;
      coating_weight_unit: string;
      diameter: string;
      diameter_unit: string;
      gross_weight: number;
      height: string;
      height_unit: string;
      length: string;
      length_unit: string;
      liquid_volume: string;
      liquid_volume_unit: string;
      net_weight: string;
      size_combined: string;
      size_combined_unit: string;
      volume: string;
      volume_unit: string;
      weight_unit: string;
      width: string;
      width_unit: string;
    };
    packaging: Array<{
      blank_product_individual_packing: boolean | null;
      description: string | null;
      dimensions: {
        diameter: number | null;
        diameter_unit: string | null;
        height: number | null;
        height_unit: string | null;
        length: number | null;
        length_unit: string | null;
        size_combined: string | null;
        width: number | null;
        width_unit: string | null;
      } | null;
      gross_weight: number | null;
      has_individual_packaging: boolean | null;
      name: string | null;
      net_weight: number | null;
      package_level: number;
      package_level_name: string;
      package_type: {
        en: string;
        es: string;
        fr: string;
        pt: string;
      };
      packaging_after_printing: string | null;
      quantity: number;
      volume: number | null;
      volume_unit: string | null;
      weight_unit: string;
    }>;
    digital_assets: Array<{
      url: string;
      is_confidencial: boolean;
      type: string;
      subtype: string;
    }>;
  }

  interface CustomProductVariantFields {
    minQuantity: number;
    item_code: string;
    ean_code: string;
    barcode: string;
    hs_code: string;
    intrastat_code: string;

    is_new: boolean;
    is_promotion: boolean;
    promotion_value: number;
    promotion_percentage: number;
    promotion_date_start: string;
    promotion_date_end: string;
    date_release: string;
    date_new_end: string;
    is_best_seller: boolean;
    is_featured: boolean;
    date_featured_start: string;
    date_featured_end: string;
    is_stockoff: boolean;
    is_discontinued: boolean;
    date_discontinued: string;
    next_stocks_1: number | null;
    next_date_1: Date | null;
    next_stocks_2: number | null;
    next_date_2: Date | null;
    next_stocks_3: number | null;
    next_date_3: Date | null;
  }

  interface QuantityPriceTier {
    price: number;
    quantityStart: number;
    quantityEnd: number;
  }
  // interface CustomProductVariantFields {
  //   quantityPriceTiers: QuantityPriceTier[];
  // }
  interface CustomProductVariantPriceFields {
    quantityPriceTiers: QuantityPriceTier[];
  }

  interface CustomChannelFields {
    nobrinde_channel_id: number;
  }
}

// nobrinde_sales_users
interface SalesFields {
  /** Sale identifier */
  mapping_id; // id_vendedor

  /** Sale abbreviation */
  initials; // sigla

  /** Sale name */
  name; //nome

  /** Sale phone number */
  phone; // telefone

  /** Sale mobile phone number */
  mobile; // telemovel

  /** Sale email */
  email; // email
}
