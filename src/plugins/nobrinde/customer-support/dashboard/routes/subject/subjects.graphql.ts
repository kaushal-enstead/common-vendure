import { graphql } from '@/gql';

const supportSubjectFragment = graphql(`
  fragment SupportSubjectItem on SupportSubject {
    id
    createdAt
    updatedAt
    code
    isActive
    name
    description
    translations {
      id
      languageCode
      name
      description
    }
  }
`);

const getSupportSubjectList = graphql(
  `
    query SupportSubjects($options: SupportSubjectListOptions) {
      supportSubjects(options: $options) {
        items {
          ...SupportSubjectItem
        }
        totalItems
      }
    }
  `,
  [supportSubjectFragment],
);

const deleteSupportSubjectDocument = graphql(`
  mutation DeleteSupportSubject($id: ID!) {
    deleteSupportSubject(id: $id) {
      result
    }
  }
`);

const deleteSupportSubjectsDocument = graphql(`
  mutation DeleteSupportSubjects($ids: [ID!]!) {
    deleteSupportSubjects(ids: $ids) {
      result
    }
  }
`);

const supportSubjectDetailDocument = graphql(
  `
    query GetSupportSubjectDetail($id: ID!) {
      supportSubject(id: $id) {
        ...SupportSubjectItem
      }
    }
  `,
  [supportSubjectFragment],
);

const createSupportSubjectDocument = graphql(`
  mutation CreateSupportSubject($input: CreateSupportSubjectInput!) {
    createSupportSubject(input: $input) {
      id
    }
  }
`);

const updateSupportSubjectDocument = graphql(`
  mutation UpdateSupportSubject($input: UpdateSupportSubjectInput!) {
    updateSupportSubject(input: $input) {
      id
    }
  }
`);

export {
  getSupportSubjectList,
  deleteSupportSubjectDocument,
  deleteSupportSubjectsDocument,
  supportSubjectDetailDocument,
  createSupportSubjectDocument,
  updateSupportSubjectDocument,
};
