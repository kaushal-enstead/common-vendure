import { gql } from 'graphql-tag';

const nobrindeBudgetLine = gql`
  type NobrindeBudgetLine implements Node {
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
    preco_unit_desc: Float
    total: Float
    iva: Float
    productVariant: ProductVariant
  }
`;

const nobrindeBudget = gql`
  type NobrindeBudget implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    id_phc: Int!
    id_site: Int
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
    total_liq: String
    iva: Float
    taxa_iva: Float
    total: Float
    observacoes: String
    sigla_comercial: String
    desc_comercial: String
    tracking: String
    pdfAssetId: String
    pdfAsset: Asset
    lines: [NobrindeBudgetLine!]!
  }
`;

const budgetApiExtensions = gql`
  ${nobrindeBudgetLine}
  ${nobrindeBudget}

  input NobrindeBudgetListOptions

  type NobrindeBudgetList implements PaginatedList {
    items: [NobrindeBudget!]!
    totalItems: Int!
  }

  type GenerateNobrindeBudgetPdfResult {
    success: Boolean!
    asset: Asset
    error: String
  }

  extend type Query {
    nobrindeBudgets(options: NobrindeBudgetListOptions): NobrindeBudgetList!
    nobrindeBudget(id: ID!): NobrindeBudget
  }

  extend type Mutation {
    generateNobrindeBudgetPdf(id: ID!): GenerateNobrindeBudgetPdfResult!
  }
`;

export { budgetApiExtensions };
