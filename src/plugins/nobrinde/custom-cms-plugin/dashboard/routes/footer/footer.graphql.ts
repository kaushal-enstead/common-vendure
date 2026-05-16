import { graphql } from '@/gql';

export const footerListDocument = graphql(`
  query FooterList($options: FooterListOptions) {
    footers(options: $options) {
      items {
        id
        createdAt
        updatedAt
        code
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`);

export const footerDetailFragment = graphql(`
  fragment FooterDetail on Footer {
    id
    createdAt
    updatedAt
    code
    navLinks {
      label
      active
      children {
        label
        type
        openInNewTab
        url
        linkRef
        active
      }
    }
    socialLinks {
      label
      image
      url
      active
    }
    translations {
      id
      languageCode
      navLinks {
        label
        active
        children {
          label
          type
          openInNewTab
          url
          linkRef
          active
        }
      }
      socialLinks {
        label
        image
        url
        active
      }
    }
    channels {
      id
      code
    }
  }
`);

export const footerDetailDocument = graphql(
  `
    query FooterDetail($id: ID!) {
      footer(id: $id) {
        ...FooterDetail
      }
    }
  `,
  [footerDetailFragment],
);

export const createFooterDocument = graphql(`
  mutation CreateFooter($input: CreateFooterInput!) {
    createFooter(input: $input) {
      id
    }
  }
`);

export const updateFooterDocument = graphql(`
  mutation UpdateFooter($input: UpdateFooterInput!) {
    updateFooter(input: $input) {
      id
    }
  }
`);

export const deleteFooterDocument = graphql(`
  mutation DeleteFooter($id: ID!) {
    deleteFooter(id: $id) {
      result
      message
    }
  }
`);

export const deleteFootersDocument = graphql(`
  mutation DeleteFooters($ids: [ID!]!) {
    deleteFooters(ids: $ids) {
      result
      message
    }
  }
`);

export const assignFootersToChannelDocument = graphql(`
  mutation AssignFootersToChannel($input: AssignFootersToChannelInput!) {
    assignFootersToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeFootersFromChannelDocument = graphql(`
  mutation RemoveFootersFromChannel($input: RemoveFootersFromChannelInput!) {
    removeFootersFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
