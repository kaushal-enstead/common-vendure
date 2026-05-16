import { graphql } from '@/gql';

export const faqListDocument = graphql(`
  query FaqList($options: FaqListOptions) {
    faqs(options: $options) {
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

export const faqDetailFragment = graphql(`
  fragment FaqDetail on Faq {
    id
    createdAt
    updatedAt
    code
    # title
    # items {
    #   question
    #   explanation
    #   index
    # }
    active
    translations {
      id
      languageCode
      title
      items {
        question
        explanation
        index
      }
    }
    channels {
      id
      code
    }
  }
`);

export const faqDetailDocument = graphql(
  `
    query FaqDetail($id: ID!) {
      faq(id: $id) {
        ...FaqDetail
      }
    }
  `,
  [faqDetailFragment],
);

export const createFaqDocument = graphql(`
  mutation CreateFaq($input: CreateFaqInput!) {
    createFaq(input: $input) {
      id
    }
  }
`);

export const updateFaqDocument = graphql(`
  mutation UpdateFaq($input: UpdateFaqInput!) {
    updateFaq(input: $input) {
      id
    }
  }
`);

export const deleteFaqDocument = graphql(`
  mutation DeleteFaq($id: ID!) {
    deleteFaq(id: $id) {
      result
      message
    }
  }
`);

export const deleteFaqsDocument = graphql(`
  mutation DeleteFaqs($ids: [ID!]!) {
    deleteFaqs(ids: $ids) {
      result
      message
    }
  }
`);

export const assignFaqsToChannelDocument = graphql(`
  mutation AssignFaqsToChannel($input: AssignFaqsToChannelInput!) {
    assignFaqsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeFaqsFromChannelDocument = graphql(`
  mutation RemoveFaqsFromChannel($input: RemoveFaqsFromChannelInput!) {
    removeFaqsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
