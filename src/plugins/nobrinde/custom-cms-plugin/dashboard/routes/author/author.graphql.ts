import { graphql } from '@/gql';

export const authorListDocument = graphql(`
  query AuthorList($options: AuthorListOptions) {
    authors(options: $options) {
      items {
        id
        createdAt
        updatedAt
        name
        title
        active
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`);

export const authorDetailFragment = graphql(`
  fragment AuthorDetail on Author {
    id
    createdAt
    updatedAt
    name
    logo
    title
    active
    translations {
      id
      languageCode
      title
    }
    channels {
      id
      code
    }
  }
`);

export const authorDetailDocument = graphql(
  `
    query AuthorDetail($id: ID!) {
      author(id: $id) {
        ...AuthorDetail
      }
    }
  `,
  [authorDetailFragment],
);

export const createAuthorDocument = graphql(`
  mutation CreateAuthor($input: CreateAuthorInput!) {
    createAuthor(input: $input) {
      id
    }
  }
`);

export const updateAuthorDocument = graphql(`
  mutation UpdateAuthor($input: UpdateAuthorInput!) {
    updateAuthor(input: $input) {
      id
    }
  }
`);

export const deleteAuthorDocument = graphql(`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id) {
      result
      message
    }
  }
`);

export const deleteAuthorsDocument = graphql(`
  mutation DeleteAuthors($ids: [ID!]!) {
    deleteAuthors(ids: $ids) {
      result
      message
    }
  }
`);

export const assignAuthorsToChannelDocument = graphql(`
  mutation AssignAuthorsToChannel($input: AssignAuthorsToChannelInput!) {
    assignAuthorsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeAuthorsFromChannelDocument = graphql(`
  mutation RemoveAuthorsFromChannel($input: RemoveAuthorsFromChannelInput!) {
    removeAuthorsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
