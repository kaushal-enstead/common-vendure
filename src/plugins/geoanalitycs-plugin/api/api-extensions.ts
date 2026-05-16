import gql from 'graphql-tag';

const geoAnalyticsAdminApiExtensions = gql`
  type GeoVisitors {
    total: Int
    nationals: Int
    internationals: Int
  }

  type GeoMetadata {
    start_date: String
    end_date: String
  }

  type GeoStatsData {
    busiest_day: String
    visits_day: Int
    busiest_hour: String
    visits_hour: Int
    residents: Int
    regulars: Int
    visitors: GeoVisitors
    tourists: GeoVisitors
    metadata: GeoMetadata
  }

  type GeoLabelsAndData {
    labels: [String!]
    data: [Int!]
  }

  type GeoVisitsPerHour {
    hours: [String!]
    visits: [Int!]
  }

  type GeoActivityData {
    days: [Int!]
    visits: [Int!]
    total: Int
    averageDuration: Int
  }

  input GeoDataInput {
    month: Int!
    year: Int!
    period: String! # day or night
    origin: String! # all, nationals, internationals
    refresh: Boolean
  }

  extend type Query {
    visitsPerHour(input: GeoDataInput!): GeoVisitsPerHour!
    geoOrigins(input: GeoDataInput!): GeoLabelsAndData!
    geoDurations(input: GeoDataInput!): GeoLabelsAndData!
    geoActivity(input: GeoDataInput!): GeoActivityData!
    geoCurrentActivity(input: GeoDataInput!): GeoStatsData!
    geoLastMonthActivity(input: GeoDataInput!): GeoStatsData!
  }
`;
export const adminApiExtensions = gql`
  ${geoAnalyticsAdminApiExtensions}
`;
