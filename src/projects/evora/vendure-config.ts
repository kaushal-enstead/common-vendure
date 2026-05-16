import type { ProjectVendureConfig } from '../types';
import {
  CustomCustomerPlugin,
  CustomFacetPlugin,
  FileCachePlugin,
  GeoAnalyticsPlugin,
  MultivendorPlugin,
  ReviewPlugin,
  SharedPlugin,
  WishlistPlugin,
  BookingPlugin,
  CustomSellerPlugin,
  PreOrderInquiryPlugin,
  QrCodePlugin,
  MarketplaceApiPlugin,
  CustomProductPlugin,
  LoyaltyPointsPlugin,
} from '../../plugins/common';
import { UuidIdStrategy } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import path from 'path';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { CustomLanguageAwareTemplateLoader } from '../email-template-loader';
import { assetUrlPrefix } from '../asset-url-prefix';

const IS_DEV = process.env.APP_ENV === 'dev';
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
    FileCachePlugin.init({ folderName: 'evora-file-cache' }),
    GeoAnalyticsPlugin.init({}),
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(process.cwd(), 'static/evora/assets'),
      assetUrlPrefix: (ctx, identifier) => assetUrlPrefix(ctx, identifier),
    }),
    EmailPlugin.init({
      ...(IS_DEV
        ? {
            devMode: true,
            route: 'mailbox',
            outputPath: path.join(process.cwd(), 'static/evora/email/test-emails'),
          }
        : {
            transport: {
              type: 'smtp',
              host: process.env.MAIL_HOST,
              port: process.env.MAIL_PORT,
              auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
              },
              secure: false, // true for 465, false for other ports
              requireTLS: true,
              tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
              },
              logging: true,
              debug: true,
            },
          }),
      handlers: [
        ...defaultEmailHandlers.map(handler => {
          const subjectMap: Record<string, Record<string, string>> = {
            'email-address-change': {
              pt: 'Verificar o seu novo email',
              en: 'Verify Your New Email Address',
            },
            'email-verification': {
              pt: 'Verificação de email solicitada',
              en: 'Email verification requested',
            },
            'order-confirmation': {
              pt: 'Confirmação de encomenda',
              en: 'Order confirmation',
            },
            'password-reset': {
              pt: 'Redefinição de senha solicitada',
              en: 'Password reset requested',
            },
          };

          const handlerType = handler.listener.type;
          const subject = subjectMap[handlerType];

          if (subject) {
            handler.setSubject(event => {
              const lang = event.ctx.languageCode;
              return subject[lang] || subject.en;
            });
          }

          return handler;
        }),
        // ...LoyaltyPointsPlugin.emailHandlers,
        // ...CustomSellerPlugin.emailHandlers,
        // ...CourierPlugin.emailHandlers,
      ],
      templateLoader: new CustomLanguageAwareTemplateLoader(
        path.join(process.cwd(), 'static/evora/email/templates'),
      ),
      globalTemplateVars: {
        adminLoginUrl: process.env.API_HOST + '/admin/login',
        verifyEmailAddressUrl: process.env.VENDURE_SHOP_URL + '/verify',
        passwordResetUrl: process.env.VENDURE_SHOP_URL + '/password-reset',
        changeEmailAddressUrl: process.env.VENDURE_SHOP_URL + '/verify-email-address-change',
        fromAddress: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      },
    }),
    MultivendorPlugin.init({
      platformFeePercent: 10,
      platformFeeSKU: 'FEE',
    }),
    SharedPlugin.init({
      orsApiKey: process.env.ORS_API_KEY!,
    }),
    CustomCustomerPlugin.init({}),
    BookingPlugin.init({}),
    ReviewPlugin.init({}),
    WishlistPlugin.init({}),
    CustomFacetPlugin.init({}),
    CustomSellerPlugin.init({}),
    PreOrderInquiryPlugin.init({}),
    QrCodePlugin.init(),
    MarketplaceApiPlugin.init({ sharedSecret: process.env.MARKETPLACE_API_SECRET ?? '' }),
    CustomProductPlugin.init({}),
    LoyaltyPointsPlugin.init({
      couponCode: 'LOYALTY',
    }),
  ],
};
