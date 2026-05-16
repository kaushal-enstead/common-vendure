import { graphql } from '@/gql';

export const visitsPerHourDocument = graphql(`
  query VisitsPerHour($input: GeoDataInput!) {
    visitsPerHour(input: $input) {
      hours
      visits
    }
  }
`);

export const geoOriginsDocument = graphql(`
  query GeoOrigins($input: GeoDataInput!) {
    geoOrigins(input: $input) {
      labels
      data
    }
  }
`);

export const geoDurationsDocument = graphql(`
  query GeoDurations($input: GeoDataInput!) {
    geoDurations(input: $input) {
      labels
      data
    }
  }
`);

export const geoActivityDocument = graphql(`
  query GeoActivity($input: GeoDataInput!) {
    geoActivity(input: $input) {
      days
      visits
      total
      averageDuration
    }
  }
`);

export const geoCurrentActivityDocument = graphql(`
  query GeoCurrentActivity($input: GeoDataInput!) {
    geoCurrentActivity(input: $input) {
      busiest_day
      visits_day
      busiest_hour
      visits_hour
      residents
      regulars
      visitors {
        total
        nationals
        internationals
      }
      tourists {
        total
        nationals
        internationals
      }
      metadata {
        start_date
        end_date
      }
    }
  }
`);

export const geoLastMonthActivityDocument = graphql(`
  query GeoLastMonthActivity($input: GeoDataInput!) {
    geoLastMonthActivity(input: $input) {
      busiest_day
      visits_day
      busiest_hour
      visits_hour
      residents
      regulars
      visitors {
        total
        nationals
        internationals
      }
      tourists {
        total
        nationals
        internationals
      }
      metadata {
        start_date
        end_date
      }
    }
  }
`);
