import { graphql } from '@/gql';

export const nobrindeOrderListDocument = graphql(`
  query GetNobrindeOrders($options: NobrindeOrderListOptions) {
    nobrindeOrders(options: $options) {
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
      }
      totalItems
    }
  }
`);

export const nobrindeOrderLineFragment = graphql(`
  fragment NobrindeOrderLineFields on NobrindeOrderLine {
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
    estado
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

export const nobrindeOrderDetailDocument = graphql(
  `
    query GetNobrindeOrder($id: ID!) {
      nobrindeOrder(id: $id) {
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
        lines {
          ...NobrindeOrderLineFields
        }
      }
    }
  `,
  [nobrindeOrderLineFragment],
);
