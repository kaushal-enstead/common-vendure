import { gql } from 'graphql-tag';

const nobrindeChannel = gql`
  type NobrindeChannel implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    channel_type: String!
    config_json: String
    created_by: String
    date_created: DateTime!
    date_updated: DateTime!
    is_active: Boolean!
    name: String!
    slug: String!
    updated_by: String
  }
`;

const channelApiExtensions = gql`
  ${nobrindeChannel}

  input NobrindeChannelListOptions

  type NobrindeChannelList implements PaginatedList {
    items: [NobrindeChannel!]!
    totalItems: Int!
  }

  extend type Query {
    nobrindeChannels(options: NobrindeChannelListOptions): NobrindeChannelList!
    nobrindeChannel(id: ID!): NobrindeChannel
  }
`;

export { channelApiExtensions };
