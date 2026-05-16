import type { ProjectVendureConfig } from '../types';
import { FileCachePlugin } from '../../plugins/file-cache-plugin/file-cache.plugin';
import { GeoAnalyticsPlugin } from '../../plugins/geoanalitycs-plugin/geoanalitycs.plugin';
import { QueryRunnerPlugin } from '../../plugins/query-runner/query-runner.plugin';
import { UuidIdStrategy } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import path from 'path';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { CustomLanguageAwareTemplateLoader } from '../email-template-loader';
import { assetUrlPrefix } from '../asset-url-prefix';

export const evoraConfig: ProjectVendureConfig = {
  migrationPath: 'src/migrations/evora',

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
  entityOptions: {
    entityIdStrategy: new UuidIdStrategy(),
  },
  plugins: [
    FileCachePlugin.init({ folderName: 'file-cache' }),
    GeoAnalyticsPlugin.init({}),
    QueryRunnerPlugin.init(),
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../../static/assets/evora'),
      assetUrlPrefix: (ctx, identifier) => assetUrlPrefix(ctx, identifier),
    }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, '../../static/email/evora/test-emails'),
      route: 'mailbox',
      handlers: defaultEmailHandlers,
      templateLoader: new CustomLanguageAwareTemplateLoader(
        path.join(__dirname, '../../static/email/evora/templates'),
      ),
      globalTemplateVars: {
        fromAddress: '"example" <noreply@example.com>',
        verifyEmailAddressUrl: 'http://localhost:8080/verify',
        passwordResetUrl: 'http://localhost:8080/password-reset',
        changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change',
      },
    }),
  ],
};
