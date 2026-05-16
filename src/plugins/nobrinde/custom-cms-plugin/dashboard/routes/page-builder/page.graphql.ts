import { graphql } from '@/gql';

export const blockColumnCssFragment = graphql(`
  fragment BlockColumnCss on PageBlockColumn {
    css
  }
`);

export const blockColumnDataFragment = graphql(`
  fragment BlockColumnData on PageBlockColumn {
    type
    label
    data
  }
`);

export const pageListDocument = graphql(`
  query PageList($options: PageListOptions) {
    pageList(options: $options) {
      items {
        id
        createdAt
        updatedAt
        title
        slug
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

export const pageDetailFragment = graphql(`
  fragment PageDetail on Page {
    id
    createdAt
    updatedAt
    title
    slug
    active
    seo {
      title
      image
      description
    }
    channels {
      id
      code
    }
  }
`);

export const pageDetailDocument = graphql(
  `
    query PageDetail($id: ID!) {
      page(id: $id) {
        ...PageDetail
      }
    }
  `,
  [pageDetailFragment],
);

export const createPageDocument = graphql(`
  mutation CreatePage($input: CreatePageInput!) {
    createPage(input: $input) {
      id
    }
  }
`);

export const updatePageDocument = graphql(`
  mutation UpdatePage($input: UpdatePageInput!) {
    updatePage(input: $input) {
      id
    }
  }
`);

export const deletePageDocument = graphql(`
  mutation DeletePage($id: ID!) {
    deletePage(id: $id) {
      result
      message
    }
  }
`);

export const deletePageListDocument = graphql(`
  mutation DeletePageList($ids: [ID!]!) {
    deletePageList(ids: $ids) {
      result
      message
    }
  }
`);

export const assignPagesToChannelDocument = graphql(`
  mutation AssignPagesToChannel($input: AssignPageToChannelInput!) {
    assignPageToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removePagesFromChannelDocument = graphql(`
  mutation RemovePagesFromChannel($input: RemovePageFromChannelInput!) {
    removePageFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const pageBlockDocument = graphql(
  `
    query PageBlock($id: ID!) {
      pageBlock(id: $id) {
        id
        code
        index
        active
        css
        translations {
          id
          languageCode
          columns {
            ...BlockColumnCss
            ...BlockColumnData
          }
        }
      }
    }
  `,
  [blockColumnCssFragment, blockColumnDataFragment],
);

export const pageBlocksDocument = graphql(
  `
    query PageBlocks($pageId: ID!) {
      pageBlocks(pageId: $pageId) {
        id
        code
        index
        active
        css
        translations {
          id
          languageCode
          columns {
            ...BlockColumnCss
            ...BlockColumnData
          }
        }
      }
    }
  `,
  [blockColumnCssFragment, blockColumnDataFragment],
);

export const createPageBlockDocument = graphql(
  `
    mutation CreatePageBlock($input: CreatePageBlockInput!) {
      createPageBlock(input: $input) {
        id
        translations {
          id
          languageCode
          columns {
            ...BlockColumnCss
            ...BlockColumnData
          }
        }
      }
    }
  `,
  [blockColumnCssFragment, blockColumnDataFragment],
);

export const updatePageBlockDocument = graphql(
  `
    mutation UpdatePageBlock($input: UpdatePageBlockInput!) {
      updatePageBlock(input: $input) {
        id
        translations {
          id
          languageCode
          columns {
            ...BlockColumnCss
            ...BlockColumnData
          }
        }
      }
    }
  `,
  [blockColumnCssFragment, blockColumnDataFragment],
);

export const deletePageBlockDocument = graphql(`
  mutation DeletePageBlock($id: ID!) {
    deletePageBlock(id: $id) {
      result
      message
    }
  }
`);

export const reorderPageBlocksDocument = graphql(`
  mutation ReorderPageBlocks($blockIds: [ID!]!) {
    reorderPageBlocks(blockIds: $blockIds) {
      id
      index
    }
  }
`);

export const duplicatePageBlockDocument = graphql(
  `
    mutation DuplicatePageBlock($id: ID!) {
      duplicatePageBlock(id: $id) {
        id
        code
        index
        active
        css
        translations {
          id
          languageCode
          columns {
            ...BlockColumnCss
            ...BlockColumnData
          }
        }
      }
    }
  `,
  [blockColumnCssFragment, blockColumnDataFragment],
);
