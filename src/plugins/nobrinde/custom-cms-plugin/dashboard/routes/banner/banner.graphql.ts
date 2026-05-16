import { graphql } from '@/gql';

export const bannerListDocument = graphql(`
  query BannerList($options: BannerListOptions) {
    banners(options: $options) {
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

export const bannerDetailFragment = graphql(`
  fragment BannerDetail on Banner {
    id
    createdAt
    updatedAt
    code
    title
    items {
      name
      description
      assetId
      index
      button {
        label
        type
        openInNewTab
        url
        linkRef
      }
    }
    active
    translations {
      id
      languageCode
      title
      items {
        name
        description
        assetId
        index
        button {
          label
          type
          openInNewTab
          url
          linkRef
        }
      }
    }
    channels {
      id
      code
    }
  }
`);

export const bannerDetailDocument = graphql(
  `
    query BannerDetail($id: ID!) {
      banner(id: $id) {
        ...BannerDetail
      }
    }
  `,
  [bannerDetailFragment],
);

export const createBannerDocument = graphql(`
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      id
    }
  }
`);

export const updateBannerDocument = graphql(`
  mutation UpdateBanner($input: UpdateBannerInput!) {
    updateBanner(input: $input) {
      id
    }
  }
`);

export const deleteBannerDocument = graphql(`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id) {
      result
      message
    }
  }
`);

export const deleteBannersDocument = graphql(`
  mutation DeleteBanners($ids: [ID!]!) {
    deleteBanners(ids: $ids) {
      result
      message
    }
  }
`);

export const assignBannersToChannelDocument = graphql(`
  mutation AssignBannersToChannel($input: AssignBannersToChannelInput!) {
    assignBannersToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeBannersFromChannelDocument = graphql(`
  mutation RemoveBannersFromChannel($input: RemoveBannersFromChannelInput!) {
    removeBannersFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
