import type { ProjectVendureConfig } from '../types';
import { FileCachePlugin } from '../../plugins/common/file-cache-plugin/file-cache.plugin';
import { GeoAnalyticsPlugin } from '../../plugins/geoanalitycs-plugin/geoanalitycs.plugin';
import { Channel, TransactionalConnection, UuidIdStrategy } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import path from 'path';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { CustomLanguageAwareTemplateLoader } from '../email-template-loader';
import { assetUrlPrefix } from '../asset-url-prefix';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

const normalizeShopBaseUrl = (domainOrUrl?: string | null): string | null => {
  if (!domainOrUrl) {
    return null;
  }
  const trimmed = domainOrUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }
  return `https://${trimmed.replace(/\/+$/, '')}`;
};

const interpolateTemplate = (template: string | undefined, vars: Record<string, string>): string => {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_full, key: string) => vars[key] ?? '');
};

const toEmailHtml = (value: string | undefined): string => {
  if (!value) return '';
  return value.replace(/\n/g, '<br/>');
};

export const nobrindeConfig: ProjectVendureConfig = {
  migrationPath: 'src/migrations/nobrinde',

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
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(process.cwd(), 'static/nobrinde/assets'),
      assetUrlPrefix: (ctx, identifier) => assetUrlPrefix(ctx, identifier),
    }),
    EmailPlugin.init({
      ...(IS_DEV
        ? {
            devMode: true,
            route: 'mailbox',
            outputPath: path.join(process.cwd(), 'static/nobrinde/email/test-emails'),
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
        // ...CustomShippingPlugin.emailHandlers,
      ],
      templateLoader: new CustomLanguageAwareTemplateLoader(
        path.join(process.cwd(), 'static/nobrinde/email/templates'),
      ),
      globalTemplateVars: async (ctx, injector) => {
        const fallbackShopUrl = normalizeShopBaseUrl(process.env.VENDURE_SHOP_URL) || '';
        const fallbackFromAddress = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;

        const defaultVars = {
          verifyEmailAddressUrl: `${fallbackShopUrl}/verify`,
          passwordResetUrl: `${fallbackShopUrl}/password-reset`,
          changeEmailAddressUrl: `${fallbackShopUrl}/verify-email-address-change`,
          fromAddress: fallbackFromAddress,
          logoUrl: '',
          storeDisplayName: process.env.MAIL_FROM_NAME || 'Store',
          privacyPolicyUrl: fallbackShopUrl ? `${fallbackShopUrl}/privacy-policy` : '',
          storeAddress: '',
          emailHeaderText: '',
          emailFooterText: '',
          supportEmail: process.env.MAIL_FROM_ADDRESS || '',
          replyToEmail: process.env.MAIL_FROM_ADDRESS || '',
          billingEmail: process.env.MAIL_FROM_ADDRESS || '',
        };

        if (!ctx) {
          return defaultVars;
        }

        const connection = injector.get(TransactionalConnection);
        const channel = await connection.getRepository(ctx, Channel).findOne({
          where: { id: ctx.channelId },
          relations: ['customFields.logo'],
        });
        const channelFields = (channel?.customFields ?? {}) as Record<string, any>;
        const logoAsset = channelFields.logo as { source?: string; preview?: string } | undefined;

        const channelShopUrl =
          normalizeShopBaseUrl(channelFields.channelDomain) ||
          normalizeShopBaseUrl(process.env.VENDURE_SHOP_URL) ||
          '';
        const fromEmail = channelFields.fromEmail || process.env.MAIL_FROM_ADDRESS || '';
        const fromAddress = fromEmail
          ? `"${channelFields.storeDisplayName || process.env.MAIL_FROM_NAME || 'Store'}" <${fromEmail}>`
          : fallbackFromAddress;
        const renderedVars = {
          logoUrl: String(logoAsset?.source || logoAsset?.preview || ''),
          storeDisplayName: String(channelFields.storeDisplayName || defaultVars.storeDisplayName || ''),
          storeAddress: String(channelFields.storeAddress || ''),
          privacyPolicyUrl: String(channelFields.privacyPolicyUrl || defaultVars.privacyPolicyUrl || ''),
          supportEmail: String(channelFields.supportEmail || defaultVars.supportEmail || ''),
        };
        const emailHeaderHtml = toEmailHtml(
          interpolateTemplate(String(channelFields.emailHeaderText || ''), renderedVars),
        );
        const emailFooterHtml = toEmailHtml(
          interpolateTemplate(String(channelFields.emailFooterText || ''), renderedVars),
        );

        const hasLogo = logoAsset?.source || logoAsset?.preview || '';
        const assetReferencePrefix = hasLogo ? assetUrlPrefix(ctx, hasLogo) : '';
        return {
          ...defaultVars,
          verifyEmailAddressUrl: `${channelShopUrl}/verify`,
          passwordResetUrl: `${channelShopUrl}/password-reset`,
          changeEmailAddressUrl: `${channelShopUrl}/verify-email-address-change`,
          fromAddress,
          logoUrl: hasLogo ? `${assetReferencePrefix}${hasLogo}` : '',
          storeDisplayName: channelFields.storeDisplayName || defaultVars.storeDisplayName,
          privacyPolicyUrl: channelFields.privacyPolicyUrl || defaultVars.privacyPolicyUrl,
          storeAddress: channelFields.storeAddress || '',
          emailHeaderText: channelFields.emailHeaderText || '',
          emailFooterText: channelFields.emailFooterText || '',
          supportEmail: channelFields.supportEmail || defaultVars.supportEmail,
          replyToEmail: channelFields.replyToEmail || defaultVars.replyToEmail,
          billingEmail: channelFields.billingEmail || defaultVars.billingEmail,
          emailHeaderHtml,
          emailFooterHtml,
        };
      },
    }),
  ],
};
