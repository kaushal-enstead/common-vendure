import { graphql } from '@/gql';

export const nobrindeBudgetListDocument = graphql(`
  query GetNobrindeBudgets($options: NobrindeBudgetListOptions) {
    nobrindeBudgets(options: $options) {
      items {
        id
        createdAt
        updatedAt
        id_phc
        id_site
        nr_doc_pv
        data_documento
        nr_entidade
        empresa
        morada
        localidade
        nif
        total_liq
        total
        iva
        # pdfAssetId
        pdfAsset {
          id
          source
        }
      }
      totalItems
    }
  }
`);

export const nobrindeBudgetLineFragment = graphql(`
  fragment NobrindeBudgetLineFields on NobrindeBudgetLine {
    id
    id_phc
    id_linhas
    ordem
    referencia_externa
    referencia
    nome_produto
    qtdd
    preco_unit
    desc
    preco_unit_desc
    total
    iva
    productVariant {
      id
      name
      sku
      priceWithTax
      currencyCode
      featuredAsset {
        id
        preview
      }
    }
  }
`);

export const nobrindeBudgetDetailDocument = graphql(
  `
    query GetNobrindeBudget($id: ID!) {
      nobrindeBudget(id: $id) {
        id
        createdAt
        updatedAt
        id_phc
        id_site
        nr_doc_pv
        data_documento
        tipo_reg
        serie
        nr_entidade
        estabelecimento
        empresa
        morada
        localidade
        c_postal
        nif
        cond_pagamento
        morada_entrega
        data_expedicao
        total_liq
        iva
        taxa_iva
        total
        observacoes
        sigla_comercial
        desc_comercial
        tracking
        pdfAsset {
          id
          source
        }
        lines {
          ...NobrindeBudgetLineFields
        }
      }
    }
  `,
  [nobrindeBudgetLineFragment],
);

export const generateNobrindeBudgetPdfDocument = graphql(`
  mutation GenerateNobrindeBudgetPdf($id: ID!) {
    generateNobrindeBudgetPdf(id: $id) {
      success
      error
      asset {
        id
        source
      }
    }
  }
`);
