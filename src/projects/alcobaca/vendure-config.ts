import type { ProjectVendureConfig } from '../types';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import path from 'path';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { CustomLanguageAwareTemplateLoader } from '../email-template-loader';
import { assetUrlPrefix } from '../asset-url-prefix';

export const alcobacaConfig: ProjectVendureConfig = {
  migrationPath: 'src/migrations/alcobaca',

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
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../../static/assets/alcobaca'),
      assetUrlPrefix: (ctx, identifier) => assetUrlPrefix(ctx, identifier),
    }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, '../../static/email/alcobaca/test-emails'),
      route: 'mailbox',
      handlers: defaultEmailHandlers,
      templateLoader: new CustomLanguageAwareTemplateLoader(
        path.join(__dirname, '../../static/email/alcobaca/templates'),
      ),
      globalTemplateVars: {
        fromAddress: '"Alcobaca" <noreply@alcobaca.com>',
        verifyEmailAddressUrl: 'http://localhost:8080/verify',
        passwordResetUrl: 'http://localhost:8080/password-reset',
        changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change',
      },
    }),
  ],
};
