import { gql } from 'graphql-tag';

const nobrindeSaleUser = gql`
  type NobrindeSaleUser implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    id_vendedor: Int!
    sigla: String
    nome: String
    telefone: String
    telemovel: String
    email: String
  }
`;

const saleUserApiExtensions = gql`
  ${nobrindeSaleUser}

  input NobrindeSaleUserListOptions

  type NobrindeSaleUserList implements PaginatedList {
    items: [NobrindeSaleUser!]!
    totalItems: Int!
  }

  extend type Query {
    nobrindeSaleUsers(options: NobrindeSaleUserListOptions): NobrindeSaleUserList!
    nobrindeSaleUser(id: ID!): NobrindeSaleUser
  }
`;

export { saleUserApiExtensions };
