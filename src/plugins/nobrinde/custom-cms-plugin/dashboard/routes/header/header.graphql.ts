import { graphql } from '@/gql';

export const headerListDocument = graphql(`
  query HeaderList($options: HeaderListOptions) {
    headers(options: $options) {
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

export const headerDetailFragment = graphql(`
  fragment HeaderDetail on Header {
    id
    createdAt
    updatedAt
    code
    logo
    navLinks {
      label
      active
      link {
        label
        type
        openInNewTab
        url
        linkRef
      }
      children {
        label
        type
        openInNewTab
        url
        linkRef
        active
      }
    }
    translations {
      id
      languageCode
      navLinks {
        label
        active
        link {
          label
          type
          openInNewTab
          url
          linkRef
        }
        children {
          label
          type
          openInNewTab
          url
          linkRef
          active
        }
      }
    }
    channels {
      id
      code
    }
  }
`);

export const headerDetailDocument = graphql(
  `
    query HeaderDetail($id: ID!) {
      header(id: $id) {
        ...HeaderDetail
      }
    }
  `,
  [headerDetailFragment],
);

export const createHeaderDocument = graphql(`
  mutation CreateHeader($input: CreateHeaderInput!) {
    createHeader(input: $input) {
      id
    }
  }
`);

export const updateHeaderDocument = graphql(`
  mutation UpdateHeader($input: UpdateHeaderInput!) {
    updateHeader(input: $input) {
      id
    }
  }
`);

export const deleteHeaderDocument = graphql(`
  mutation DeleteHeader($id: ID!) {
    deleteHeader(id: $id) {
      result
      message
    }
  }
`);

export const deleteHeadersDocument = graphql(`
  mutation DeleteHeaders($ids: [ID!]!) {
    deleteHeaders(ids: $ids) {
      result
      message
    }
  }
`);

export const assignHeadersToChannelDocument = graphql(`
  mutation AssignHeadersToChannel($input: AssignHeadersToChannelInput!) {
    assignHeadersToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeHeadersFromChannelDocument = graphql(`
  mutation RemoveHeadersFromChannel($input: RemoveHeadersFromChannelInput!) {
    removeHeadersFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
