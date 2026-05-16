import { graphql } from '@/gql';

export const documentListDocument = graphql(`
  query DocumentList($options: DocumentListOptions) {
    documents(options: $options) {
      items {
        id
        createdAt
        updatedAt
        code
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

export const documentDetailFragment = graphql(`
  fragment DocumentDetail on Document {
    id
    createdAt
    updatedAt
    code
    title
    items {
      name
      assetId
      index
    }
    active
    translations {
      id
      languageCode
      title
      items {
        name
        assetId
        index
      }
    }
    channels {
      id
      code
    }
  }
`);

export const documentDetailDocument = graphql(
  `
    query DocumentDetail($id: ID!) {
      document(id: $id) {
        ...DocumentDetail
      }
    }
  `,
  [documentDetailFragment],
);

export const createDocumentDocument = graphql(`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
    }
  }
`);

export const updateDocumentDocument = graphql(`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
    }
  }
`);

export const deleteDocumentDocument = graphql(`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id) {
      result
      message
    }
  }
`);

export const deleteDocumentsDocument = graphql(`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids) {
      result
      message
    }
  }
`);

export const assignDocumentsToChannelDocument = graphql(`
  mutation AssignDocumentsToChannel($input: AssignDocumentsToChannelInput!) {
    assignDocumentsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeDocumentsFromChannelDocument = graphql(`
  mutation RemoveDocumentsFromChannel($input: RemoveDocumentsFromChannelInput!) {
    removeDocumentsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
