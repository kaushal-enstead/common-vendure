import { graphql } from '@/gql';

export const nobrindeChannelListDocument = graphql(`
  query GetNobrindeChannels($options: NobrindeChannelListOptions) {
    nobrindeChannels(options: $options) {
      items {
        id
        createdAt
        updatedAt
        channel_type
        config_json
        created_by
        date_created
        date_updated
        is_active
        name
        slug
        updated_by
      }
      totalItems
    }
  }
`);

export const nobrindeChannelDetailDocument = graphql(`
  query GetNobrindeChannel($id: ID!) {
    nobrindeChannel(id: $id) {
      id
      createdAt
      updatedAt
      channel_type
      config_json
      created_by
      date_created
      date_updated
      is_active
      name
      slug
      updated_by
    }
  }
`);
