import { graphql } from '@/gql';

export const nobrindeSaleUserListDocument = graphql(`
  query GetNobrindeSaleUsers($options: NobrindeSaleUserListOptions) {
    nobrindeSaleUsers(options: $options) {
      items {
        id
        createdAt
        updatedAt
        id_vendedor
        sigla
        nome
        telefone
        telemovel
        email
      }
      totalItems
    }
  }
`);

export const nobrindeSaleUserDetailDocument = graphql(`
  query GetNobrindeSaleUser($id: ID!) {
    nobrindeSaleUser(id: $id) {
      id
      createdAt
      updatedAt
      id_vendedor
      sigla
      nome
      telefone
      telemovel
      email
    }
  }
`);
