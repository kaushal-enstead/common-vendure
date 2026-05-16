import { gql } from 'graphql-tag';

const nobrindeOrderLine = gql`
  type NobrindeOrderLine implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    id_phc: Int!
    id_linhas: String
    ordem: Int
    referencia_externa: String
    referencia: String
    nome_produto: String
    qtdd: Int
    preco_unit: Float
    desc: Float
    preco_unit_desc: Int
    total: Float
    iva: Float
    estado: String
    productVariant: ProductVariant
  }
`;

const nobrindeOrder = gql`
  type NobrindeOrder implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    id_phc: Int!
    id_site: String
    nr_doc_pv: Int
    data_documento: String
    tipo_reg: Int
    serie: String
    nr_entidade: Int
    estabelecimento: Int
    empresa: String
    morada: String
    localidade: String
    c_postal: String
    nif: String
    cond_pagamento: String
    morada_entrega: String
    data_expedicao: String
    total_liq: Float
    iva: Float
    taxa_iva: Float
    total: Float
    observacoes: String
    sigla_comercial: String
    desc_comercial: Float
    tracking: String
    lines: [NobrindeOrderLine!]!
  }
`;

const orderApiExtensions = gql`
  ${nobrindeOrderLine}
  ${nobrindeOrder}

  input NobrindeOrderListOptions
  type NobrindeOrderList implements PaginatedList {
    items: [NobrindeOrder!]!
    totalItems: Int!
  }

  extend type Query {
    nobrindeOrders(options: NobrindeOrderListOptions): NobrindeOrderList!
    nobrindeOrder(id: ID!): NobrindeOrder
  }
`;

export { orderApiExtensions };
