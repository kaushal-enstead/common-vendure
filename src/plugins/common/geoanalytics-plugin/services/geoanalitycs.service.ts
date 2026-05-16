import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from '@vendure/core';
import { GEOANALITYCS_PLUGIN_OPTIONS } from '../constants';
import { PluginInitOptions } from '../types';
import {
  FileCacheType,
  GeoDataInput,
  GeoLabelsAndData,
  GeoVisitsPerHour,
  GeoActivityData,
  GeoStatsData,
} from '../gql/generated';
import { FileCacheService } from '../../../common/file-cache-plugin/services/file-cache.service';
interface ApiResponse<T> {
  data: T;
  metadata?: { average?: number; total?: number; avg_hour?: number; amount?: number };
}

type VisitData = { date: string; value: number };
type HourlyVisitData = { time: string; value: number };
type OriginData = { label: string; value: number };
type DurationData = { duration: string; value: number };

@Injectable()
export class GeoAnalyticsService {
  private readonly URL = 'https://api.altice-pt.kidodynamics.com';
  private readonly HOSTID = '151210';
  private readonly CACHE_PREFIX = 'geoanalitycs_';
  private readonly CACHE_TTL_DAYS = 20;

  constructor(
    private readonly fileCacheService: FileCacheService,
    @Inject(GEOANALITYCS_PLUGIN_OPTIONS) private readonly options: PluginInitOptions,
  ) {}

  private async fetchFromApi<T>(
    ctx: RequestContext,
    endpoint: string,
    cacheKey: string,
    params?: Record<string, string>,
    forceRefresh = false,
  ): Promise<T> {
    const fullCacheKey = this.CACHE_PREFIX + cacheKey;
    const cachedData = await this.fileCacheService.find(ctx, fullCacheKey);
    let canUpdateExistingCache = Boolean(cachedData);

    // Try to get from cache first (unless refresh is requested)
    if (!forceRefresh && cachedData && !this.isCacheExpired(cachedData.createdAt)) {
      try {
        return JSON.parse(cachedData.value);
      } catch (error) {
        // Corrupted/partial cache should not break dashboard; drop it and refetch.
        await this.fileCacheService.delete(ctx, fullCacheKey);
        canUpdateExistingCache = false;
      }
    }

    // Clean stale cache entry before refreshing from network
    if (cachedData && this.isCacheExpired(cachedData.createdAt)) {
      await this.fileCacheService.delete(ctx, fullCacheKey);
      canUpdateExistingCache = false;
    }

    try {
      const formData = new FormData();
      formData.append('username', process.env.GEOANALITYCS_USERNAME ?? '');
      formData.append('password', process.env.GEOANALITYCS_PASSWORD ?? '');

      const loginResponse = await fetch(`${this.URL}/v1/users/login`, {
        method: 'POST',
        body: formData,
      });
      const loginText = await loginResponse.text();
      if (!loginText) {
        throw new Error('Geoanalytics login response is empty');
      }
      const { access_token } = JSON.parse(loginText) as { access_token?: string };
      if (!access_token) {
        throw new Error('Geoanalytics login response missing access token');
      }

      const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
      const path = `${endpoint}${queryParams}`;

      const response = await fetch(`${this.URL}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const responseText = await response.text();
      if (!responseText) {
        throw new Error(`Geoanalytics API returned empty response for ${path}`);
      }
      const data = JSON.parse(responseText);

      // Store latest response in cache
      if (canUpdateExistingCache) {
        await this.fileCacheService.update(ctx, {
          id: fullCacheKey,
          value: JSON.stringify(data),
        });
      } else {
        await this.fileCacheService.create(ctx, {
          id: fullCacheKey,
          value: JSON.stringify(data),
          type: FileCacheType.JSON,
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  private isCacheExpired(createdAt: Date | string): boolean {
    const createdAtDate = new Date(createdAt);
    if (Number.isNaN(createdAtDate.getTime())) {
      return true;
    }

    const expiresAt = new Date(createdAtDate);
    expiresAt.setDate(expiresAt.getDate() + this.CACHE_TTL_DAYS);

    return Date.now() > expiresAt.getTime();
  }

  private shouldForceRefresh(args: GeoDataInput): boolean {
    return Boolean((args as GeoDataInput & { refresh?: boolean }).refresh);
  }

  private logAndReturnFallback<T>(scope: string, error: unknown, fallback: T): T {
    console.error(`Geoanalytics fallback used for ${scope}:`, error);
    return fallback;
  }

  async visitsPerHour(ctx: RequestContext, args: GeoDataInput): Promise<GeoVisitsPerHour> {
    const { month, year, period, origin } = args;
    if (!month || !year) {
      throw new Error('month and year are required');
    }

    try {
      const { startDate, endDate } = this.getStartAndEndDate(month, year);
      const { data } = await this.fetchFromApi<ApiResponse<HourlyVisitData[]>>(
        ctx,
        `/v1/tourism/visits/hourly/${this.HOSTID}/${startDate}/${endDate}/${period}/${origin}`,
        `visits_hourly_${month}_${year}_${period}_${origin}`,
        undefined,
        this.shouldForceRefresh(args),
      );

      const hours = data?.map(entry =>
        new Date(entry.time).toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
      const visitsByHour = data?.map(entry => entry.value);

      return {
        hours,
        visits: visitsByHour,
      };
    } catch (error) {
      return this.logAndReturnFallback('visitsPerHour', error, { hours: [], visits: [] });
    }
  }

  async geoOrigins(ctx: RequestContext, args: GeoDataInput): Promise<GeoLabelsAndData> {
    const { month, year, period, origin } = args;
    if (!month || !year) {
      throw new Error('month and year are required');
    }

    try {
      const { startDate, endDate } = this.getStartAndEndDate(month, year);
      const { data } = await this.fetchFromApi<ApiResponse<OriginData[]>>(
        ctx,
        `/v1/tourism/visits/by_origin/${this.HOSTID}/${startDate}/${endDate}/monthly/${period}/${origin}?max=8`,
        `visits_by_origin_${month}_${year}_${period}_${origin}`,
        undefined,
        this.shouldForceRefresh(args),
      );

      const labels = data?.map(entry => entry.label);
      const values = data?.map(entry => entry.value);

      return {
        labels,
        data: values,
      };
    } catch (error) {
      return this.logAndReturnFallback('geoOrigins', error, { labels: [], data: [] });
    }
  }

  async geoDurations(ctx: RequestContext, args: GeoDataInput): Promise<GeoLabelsAndData> {
    const { month, year, period, origin } = args;
    if (!month || !year) {
      throw new Error('month and year are required');
    }

    try {
      const { startDate, endDate } = this.getStartAndEndDate(month, year);
      const { data } = await this.fetchFromApi<ApiResponse<DurationData[]>>(
        ctx,
        `/v1/tourism/visits/by_duration/${this.HOSTID}/${startDate}/${endDate}/monthly/${period}/${origin}`,
        `visits_by_duration_${month}_${year}_${period}_${origin}`,
        undefined,
        this.shouldForceRefresh(args),
      );

      const labels = data?.map(entry => entry.duration);
      const values = data?.map(entry => entry.value);

      return {
        labels,
        data: values,
      };
    } catch (error) {
      return this.logAndReturnFallback('geoDurations', error, { labels: [], data: [] });
    }
  }

  async geoActivity(ctx: RequestContext, args: GeoDataInput): Promise<GeoActivityData> {
    const { month, year, period, origin } = args;
    if (!month || !year) {
      throw new Error('month and year are required');
    }

    try {
      const { startDate, endDate } = this.getStartAndEndDate(month, year);
      const forceRefresh = this.shouldForceRefresh(args);
      const { data } = await this.fetchFromApi<ApiResponse<VisitData[]>>(
        ctx,
        `/v1/tourism/visits/daily/${this.HOSTID}/${startDate}/${endDate}/${period}/${origin}`,
        `visits_daily_${month}_${year}_${period}_${origin}`,
        undefined,
        forceRefresh,
      );

      const { metadata } = await this.fetchFromApi<ApiResponse<DurationData[]>>(
        ctx,
        `/v1/tourism/visits/by_duration/${this.HOSTID}/${startDate}/${endDate}/monthly/${period}/${origin}`,
        `visits_by_duration_${month}_${year}_${period}_${origin}`,
        undefined,
        forceRefresh,
      );

      const days = data?.map(d => d.date) ?? [];
      const visits = data?.map(d => d.value) ?? [];
      const total = visits.reduce((sum, val) => sum + val, 0);

      return {
        days: days?.map(d => parseInt(d.split('-')[2], 10)) ?? [],
        visits,
        total,
        averageDuration: Math.round(metadata?.average ?? 0),
      };
    } catch (error) {
      return this.logAndReturnFallback('geoActivity', error, {
        days: [],
        visits: [],
        total: 0,
        averageDuration: 0,
      });
    }
  }

  async geoMonthlyActivity(
    ctx: RequestContext,
    args: GeoDataInput,
    type: 'current' | 'previous',
  ): Promise<GeoStatsData> {
    const { month, year } = args;
    if (!month || !year) {
      throw new Error('month and year are required');
    }

    try {
      const { startDate, endDate } = this.getStartAndEndDate(month, year, type);
      const { current } = await this.fetchFromApi<{
        current: GeoStatsData;
        previous: GeoStatsData;
      }>(
        ctx,
        `/v1/tourism/overview/${this.HOSTID}/${startDate}/${endDate}/monthly`,
        `overview_${month}_${year}_${type}`,
        undefined,
        this.shouldForceRefresh(args),
      );

      return {
        busiest_day: current?.busiest_day || null,
        visits_day: current?.visits_day || null,
        busiest_hour: current?.busiest_hour || null,
        visits_hour: current?.visits_hour || null,
        residents: current?.residents || null,
        regulars: current?.regulars || null,
        visitors: current?.visitors || null,
        tourists: current?.tourists || null,
        metadata: current?.metadata || null,
      };
    } catch (error) {
      return this.logAndReturnFallback('geoMonthlyActivity', error, {
        busiest_day: null,
        visits_day: null,
        busiest_hour: null,
        visits_hour: null,
        residents: null,
        regulars: null,
        visitors: null,
        tourists: null,
        metadata: null,
      });
    }
  }
  private getStartAndEndDate(
    month: number,
    year: number,
    type: 'current' | 'previous' = 'current',
  ): { startDate: string; endDate: string } {
    if (type === 'previous') {
      const lastMonthStart = this.formatLocalDate(new Date(year, month - 2, 1));
      const lastMonthEnd = this.formatLocalDate(new Date(year, month - 1, 0));

      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    }

    const startDate = this.formatLocalDate(new Date(year, month - 1, 1));
    const endDate = this.formatLocalDate(new Date(year, month, 0));

    return { startDate, endDate };
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
