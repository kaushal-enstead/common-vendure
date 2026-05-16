import { graphql } from '@/gql';
import { assetFragment } from '@vendure/dashboard';

export const alertListDocument = graphql(`
  query AlertList($options: AlertListOptions) {
    alerts(options: $options) {
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

export const alertDetailFragment = graphql(
  `
    fragment AlertDetail on Alert {
      id
      createdAt
      updatedAt
      code
      title
      assetId
      asset {
        ...Asset
      }
      content
      targetUrls
      button {
        label
        type
        openInNewTab
        url
        linkRef
      }
      active
      translations {
        id
        languageCode
        title
        content
        targetUrls
        button {
          label
          type
          openInNewTab
          url
          linkRef
        }
      }
      channels {
        id
        code
      }
    }
  `,
  [assetFragment],
);

export const alertDetailDocument = graphql(
  `
    query AlertDetail($id: ID!) {
      alert(id: $id) {
        ...AlertDetail
      }
    }
  `,
  [alertDetailFragment],
);

export const createAlertDocument = graphql(`
  mutation CreateAlert($input: CreateAlertInput!) {
    createAlert(input: $input) {
      id
    }
  }
`);

export const updateAlertDocument = graphql(`
  mutation UpdateAlert($input: UpdateAlertInput!) {
    updateAlert(input: $input) {
      id
    }
  }
`);

export const deleteAlertDocument = graphql(`
  mutation DeleteAlert($id: ID!) {
    deleteAlert(id: $id) {
      result
      message
    }
  }
`);

export const deleteAlertsDocument = graphql(`
  mutation DeleteAlerts($ids: [ID!]!) {
    deleteAlerts(ids: $ids) {
      result
      message
    }
  }
`);

export const assignAlertsToChannelDocument = graphql(`
  mutation AssignAlertsToChannel($input: AssignAlertsToChannelInput!) {
    assignAlertsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeAlertsFromChannelDocument = graphql(`
  mutation RemoveAlertsFromChannel($input: RemoveAlertsFromChannelInput!) {
    removeAlertsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const linkRefOptionsDocument = graphql(`
  query LinkRefOptions {
    linkRefOptions {
      page {
        entity
        label
        value
      }
      author {
        entity
        label
        value
      }
      document {
        entity
        label
        value
      }
    }
  }
`);
