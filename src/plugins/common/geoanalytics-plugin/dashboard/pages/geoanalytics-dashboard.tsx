import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Button, Page, PageBlock, PageLayout, PageTitle } from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  geoCurrentActivityDocument,
  geoLastMonthActivityDocument,
  geoActivityDocument,
  geoDurationsDocument,
  geoOriginsDocument,
  visitsPerHourDocument,
} from '../gql';
import { StatCard } from '../components/stat-card';
import { PresenceCard } from '../components/presence-card';
import { ActivitySection } from '../components/activity-section';
import { DonutChartCard } from '../components/donut-chart-card';
import { LineChart } from '../components/line-chart';

type Origin = 'all' | 'nationals' | 'internationals';
type Period = 'day' | 'night';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

function buildYears() {
  const year = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => year - i);
}

function defaultMonthYear() {
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { month: last.getMonth() + 1, year: last.getFullYear() };
}

const pageId = 'geoanalytics-page';

export function GeoAnalyticsDashboard() {
  const { t } = useLingui();
  const { month: initMonth, year: initYear } = defaultMonthYear();
  const years = buildYears();

  const [selectedMonth, setSelectedMonth] = useState(initMonth);
  const [selectedYear, setSelectedYear] = useState(initYear);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('day');
  const [selectedOrigin, setSelectedOrigin] = useState<Origin>('all');
  const [refresh, setRefresh] = useState(false);

  const [appliedMonth, setAppliedMonth] = useState(initMonth);
  const [appliedYear, setAppliedYear] = useState(initYear);
  const [appliedPeriod, setAppliedPeriod] = useState<Period>('day');
  const [appliedOrigin, setAppliedOrigin] = useState<Origin>('all');
  const [appliedRefresh, setAppliedRefresh] = useState(false);

  const input = {
    month: appliedMonth,
    year: appliedYear,
    period: appliedPeriod,
    origin: appliedOrigin,
    refresh: appliedRefresh,
  };

  const queryKey = [appliedMonth, appliedYear, appliedPeriod, appliedOrigin, appliedRefresh];

  const { data: currentActivityData, isLoading: l1 } = useQuery({
    queryKey: ['geoCurrentActivity', ...queryKey],
    queryFn: () => api.query(geoCurrentActivityDocument, { input }),
  });

  const { data: lastMonthData, isLoading: l2 } = useQuery({
    queryKey: ['geoLastMonthActivity', ...queryKey],
    queryFn: () => api.query(geoLastMonthActivityDocument, { input }),
  });

  const { data: activityData, isLoading: l3 } = useQuery({
    queryKey: ['geoActivity', ...queryKey],
    queryFn: () => api.query(geoActivityDocument, { input }),
  });

  const { data: durationsData, isLoading: l4 } = useQuery({
    queryKey: ['geoDurations', ...queryKey],
    queryFn: () => api.query(geoDurationsDocument, { input }),
  });

  const { data: originsData, isLoading: l5 } = useQuery({
    queryKey: ['geoOrigins', ...queryKey],
    queryFn: () => api.query(geoOriginsDocument, { input }),
  });

  const { data: visitsPerHourData, isLoading: l6 } = useQuery({
    queryKey: ['visitsPerHour', ...queryKey],
    queryFn: () => api.query(visitsPerHourDocument, { input }),
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

  const handleApply = () => {
    if (!selectedMonth || !selectedYear) {
      toast.warning(t`Select a month and year`);
      return;
    }
    setAppliedMonth(selectedMonth);
    setAppliedYear(selectedYear);
    setAppliedPeriod(selectedPeriod);
    setAppliedOrigin(selectedOrigin);
    setAppliedRefresh(false);
  };

  const handleRefresh = () => {
    setAppliedRefresh(r => !r);
  };

  const currentActivity = currentActivityData?.geoCurrentActivity;
  const lastMonthActivity = lastMonthData?.geoLastMonthActivity;
  const activity = activityData?.geoActivity;
  const durations = durationsData?.geoDurations;
  const origins = originsData?.geoOrigins;
  const visitsPerHour = visitsPerHourData?.visitsPerHour;

  return (
    // <Page pageId={pageId}>
    //     <PageTitle>GeoAnalytics</PageTitle>
    //     <PageLayout>
    //         <PageBlock column="main" blockId="points-allocator">

    <div className="flex flex-col gap-8 p-6">
      <section className="flex flex-col gap-1 bg-secondary/50 border-2 border-secondary p-4 rounded">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          <Trans>Analytics dashboard</Trans>
        </span>
        <h1 className="text-3xl font-bold text-foreground">
          <Trans>GeoAnalytics</Trans>
        </h1>
        <p className="text-sm text-muted-foreground">
          <Trans>Overview of presence, activity and visitor behaviour.</Trans>
        </p>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <label className="text-sm text-foreground">
            <Trans>Period:</Trans>
          </label>
          <select
            className="rounded border border-muted bg-background text-foreground px-2 py-1.5 text-sm"
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-muted bg-background text-foreground px-2 py-1.5 text-sm"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button variant="default" onClick={handleApply} disabled={isLoading}>
            <Trans>Apply</Trans>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            <Trans>Refresh</Trans>
          </Button>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-secondary/50 border-2 border-secondary p-4 rounded">
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-medium text-foreground">
                  <Trans>Selected period</Trans>
                </p>
                <p className="text-xs text-muted-foreground">
                  <Trans>Current filtered month</Trans>
                </p>
              </div>
              <StatCard
                title={t`Busiest day`}
                date={currentActivity?.busiest_day}
                value={currentActivity?.visits_day}
              />
              <StatCard
                title={t`Busiest hour`}
                date={currentActivity?.busiest_hour ?? undefined}
                value={currentActivity?.visits_hour}
              />
              <PresenceCard
                total={currentActivity?.visitors?.total}
                residents={currentActivity?.residents}
                regulars={currentActivity?.regulars}
                visitors={{
                  nacionais: currentActivity?.visitors?.nationals,
                  internacionais: currentActivity?.visitors?.internationals,
                }}
                tourists={{
                  nacionais: currentActivity?.tourists?.nationals,
                  internacionais: currentActivity?.tourists?.internationals,
                }}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="font-medium text-foreground">
                  <Trans>Comparison with last month</Trans>
                </p>
                <p className="text-xs text-muted-foreground">
                  <Trans>Historical reference</Trans>
                </p>
              </div>
              <StatCard
                title={t`Busiest day (last month)`}
                date={lastMonthActivity?.busiest_day}
                value={lastMonthActivity?.visits_day}
              />
              <StatCard
                title={t`Busiest hour (last month)`}
                date={lastMonthActivity?.busiest_hour ?? undefined}
                value={lastMonthActivity?.visits_hour}
              />
              <PresenceCard
                total={lastMonthActivity?.visitors?.total}
                residents={lastMonthActivity?.residents}
                regulars={lastMonthActivity?.regulars}
                visitors={{
                  nacionais: lastMonthActivity?.visitors?.nationals,
                  internacionais: lastMonthActivity?.visitors?.internationals,
                }}
                tourists={{
                  nacionais: lastMonthActivity?.tourists?.nationals,
                  internacionais: lastMonthActivity?.tourists?.internationals,
                }}
              />
            </div>
          </div>

          <section className="flex flex-col gap-6 bg-secondary/50 border-2 border-secondary p-4 rounded">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                <Trans>Activity and visitor profile</Trans>
              </h2>
              <p className="text-sm text-muted-foreground">
                <Trans>Explore daily volume, origin distribution and length of stay.</Trans>
              </p>
            </div>

            <ActivitySection
              days={activity?.days}
              visits={activity?.visits}
              total={activity?.total}
              averageDuration={activity?.averageDuration}
              origin={appliedOrigin}
              onPeriodChange={p => {
                setSelectedPeriod(p);
                setAppliedPeriod(p);
              }}
              onOriginChange={o => {
                setSelectedOrigin(o);
                setAppliedOrigin(o);
              }}
            />

            <div className="flex gap-4 flex-wrap">
              <DonutChartCard
                title={t`Duration`}
                labels={durations?.labels ?? []}
                data={durations?.data ?? []}
              />
              <DonutChartCard
                title={t`Visitor origin`}
                labels={origins?.labels ?? []}
                data={origins?.data ?? []}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 bg-secondary/50 border-2 border-secondary p-4 rounded">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                <Trans>Hourly pattern</Trans>
              </h2>
              <p className="text-sm text-muted-foreground">
                <Trans>Visit evolution by hour in the selected period.</Trans>
              </p>
            </div>
            <LineChart
              title={t`Visits per hour`}
              labels={visitsPerHour?.hours}
              data={visitsPerHour?.visits}
            />
          </section>
        </>
      )}
    </div>
    //          </PageBlock>
    //     </PageLayout>
    // </Page>
  );
}
