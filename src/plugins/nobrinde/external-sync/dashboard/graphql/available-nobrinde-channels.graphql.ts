import { graphql } from '@/gql';

export const availableNobrindeChannelsDocument = graphql(`
  query AvailableNobrindeChannels($currentChannelId: ID, $options: NobrindeChannelListOptions) {
    availableNobrindeChannels(currentChannelId: $currentChannelId, options: $options) {
      items {
        id
        name
        slug
      }
      totalItems
    }
  }
`);
