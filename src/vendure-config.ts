import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  VendureConfig,
  UuidIdStrategy,
  NativeAuthenticationStrategy,
} from '@vendure/core';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import path from 'path';
import { getProject } from './projects';
import { mergeProjectConfig } from './projects/merge';
import { QueryRunnerPlugin } from './plugins/common';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

const baseConfig: VendureConfig = {
  apiOptions: {
    port: serverPort,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    trustProxy: IS_DEV ? false : 1,
    ...(IS_DEV
      ? {
          adminApiDebug: true,
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME,
      password: process.env.SUPERADMIN_PASSWORD,
    },
    cookieOptions: {
      secret: process.env.COOKIE_SECRET,
    },
    shopAuthenticationStrategy: [new NativeAuthenticationStrategy()],
    requireVerification: true,
  },
  entityOptions: {
    entityIdStrategy: new UuidIdStrategy(),
  },
  dbConnectionOptions: {
    type: 'mysql',
    synchronize: false,
    migrations: [],
    logging: false,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  customFields: {},
  plugins: [
    GraphiqlPlugin.init(),
    DefaultSchedulerPlugin.init(),
    DefaultJobQueuePlugin.init({
      useDatabaseForBuffer: true,
      pollInterval: queueName => {
        let oneHour = 60 * 60 * 1000;
        switch (queueName) {
          case 'send-email':
            return 1_000; // 1 second
          case 'clean-sessions':
            return 2 * oneHour;
          case 'update-search-index':
            return oneHour;
          case 'apply-collection-filters':
            return 1 * oneHour;
          default:
            return 10_000;
        }
      },
      backoffStrategy: (queueName, attemptsMade, job) => {
        if (queueName === 'send-email') {
          return 10_000; // 10 seconds for email jobs
        }
        return 1000;
      },
      // The number of completed/failed/cancelled
      keepJobsCount: 100,
      // The interval at which to run the clean-up task.
      cleanJobsSchedule: cron => cron.every(2).hours(),
    }),
    DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
    DashboardPlugin.init({
      route: 'dashboard',
      appDir: IS_DEV ? path.join(__dirname, '../dist/dashboard') : path.join(__dirname, 'dashboard'),
    }),
    QueryRunnerPlugin.init(),
  ],
};

export const config: VendureConfig = mergeProjectConfig(baseConfig, getProject(process.env.PROJECT_NAME));
