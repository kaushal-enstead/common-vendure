import { Asset, LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { shopApiExtensions } from './api/api-extensions';
import { ChannelPersonalizationResolver } from './api/channel-personalization.resolver';
import { ChannelPersonalizationService } from './services/channel-personalization.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [ChannelPersonalizationService],
  configuration: config => {
    const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    const DOMAIN_REGEX = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$/;
    const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    const ALLOWED_FONTS = [
      'Inter, sans-serif',
      'Roboto, sans-serif',
      '"Open Sans", sans-serif',
      'Lato, sans-serif',
      'Montserrat, sans-serif',
      'Poppins, sans-serif',
      '"Source Sans Pro", sans-serif',
      'Arial, sans-serif',
      '"Helvetica Neue", sans-serif',
      '"Times New Roman", serif',
    ];

    config.customFields.Channel.push(
      {
        name: 'logo',
        type: 'relation',
        entity: Asset,
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Store Logo' },
          { languageCode: LanguageCode.pt, value: 'Logotipo da Loja' },
        ],
        ui: { tab: 'Personalization' },
      },
      {
        name: 'favicon',
        type: 'relation',
        entity: Asset,
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Favicon' },
          { languageCode: LanguageCode.pt, value: 'Favicon' },
        ],
        ui: { tab: 'Personalization' },
      },
      {
        name: 'colors',
        type: 'struct',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Colors' },
          { languageCode: LanguageCode.pt, value: 'Cores' },
        ],
        fields: [
          {
            name: 'primary',
            type: 'string',
            label: [
              { languageCode: LanguageCode.en, value: 'Primary color' },
              { languageCode: LanguageCode.pt, value: 'Cor principal' },
            ],
            validate: (value: unknown) => {
              if (value == null || value === '') return;
              if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
                return 'Primary color must be a valid hex color (e.g. #1A2B3C)';
              }
            },
            ui: { component: 'channel-color-picker' },
          },
          {
            name: 'secondary',
            type: 'string',
            label: [
              { languageCode: LanguageCode.en, value: 'Secondary color' },
              { languageCode: LanguageCode.pt, value: 'Cor secundária' },
            ],
            validate: (value: unknown) => {
              if (value == null || value === '') return;
              if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
                return 'Secondary color must be a valid hex color (e.g. #1A2B3C)';
              }
            },
            ui: { component: 'channel-color-picker' },
          },
          {
            name: 'foreground',
            type: 'string',
            label: [
              { languageCode: LanguageCode.en, value: 'Foreground color' },
              { languageCode: LanguageCode.pt, value: 'Cor do texto' },
            ],
            validate: (value: unknown) => {
              if (value == null || value === '') return;
              if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
                return 'Foreground color must be a valid hex color (e.g. #1A2B3C)';
              }
            },
            ui: { component: 'channel-color-picker' },
          },
          {
            name: 'background',
            type: 'string',
            label: [
              { languageCode: LanguageCode.en, value: 'Background color' },
              { languageCode: LanguageCode.pt, value: 'Cor de fundo' },
            ],
            validate: (value: unknown) => {
              if (value == null || value === '') return;
              if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
                return 'Background color must be a valid hex color (e.g. #1A2B3C)';
              }
            },
            ui: { component: 'channel-color-picker' },
          },
        ],
        ui: { tab: 'Personalization' },
      },
      {
        name: 'fontFamily',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Font family' },
          { languageCode: LanguageCode.pt, value: 'Tipo de letra' },
        ],
        validate: (value: unknown) => {
          if (value == null || value === '') return;
          if (typeof value !== 'string' || !ALLOWED_FONTS.includes(value)) {
            return 'Please select a valid font family from the dropdown list';
          }
        },
        ui: { component: 'channel-font-family-select', tab: 'Personalization' },
      },
      {
        name: 'storeDisplayName',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Store display name' },
          { languageCode: LanguageCode.pt, value: 'Nome de exibição da loja' },
        ],
        ui: { tab: 'Personalization' },
      },
      {
        name: 'privacyPolicyUrl',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Privacy policy URL' },
          { languageCode: LanguageCode.pt, value: 'URL da política de privacidade' },
        ],
        validate: (value: unknown) => {
          if (value == null || value === '') return;
          if (typeof value !== 'string' || !URL_REGEX.test(value)) {
            return 'Privacy policy URL must be a valid http/https URL';
          }
        },
        ui: { tab: 'Personalization' },
      },
      {
        name: 'emailHeaderText',
        type: 'text',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Email header content' },
          { languageCode: LanguageCode.pt, value: 'Conteúdo do cabeçalho do email' },
        ],
        ui: { component: 'channel-email-template-editor', tab: 'Email' },
      },
      {
        name: 'emailFooterText',
        type: 'text',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Email footer text' },
          { languageCode: LanguageCode.pt, value: 'Texto do rodapé do email' },
        ],
        ui: { component: 'channel-email-template-editor', tab: 'Email' },
      },
      {
        name: 'fromEmail',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'From email' },
          { languageCode: LanguageCode.pt, value: 'Email de origem' },
        ],
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        ui: { component: 'channel-email-input', tab: 'Email' },
      },
      {
        name: 'replyToEmail',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Reply-to email' },
          { languageCode: LanguageCode.pt, value: 'Email de resposta' },
        ],
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        ui: { component: 'channel-email-input', tab: 'Email' },
      },
      {
        name: 'supportEmail',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Support email' },
          { languageCode: LanguageCode.pt, value: 'Email de suporte' },
        ],
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        ui: { component: 'channel-email-input', tab: 'Email' },
      },
      {
        name: 'billingEmail',
        type: 'string',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Billing email' },
          { languageCode: LanguageCode.pt, value: 'Email de faturação' },
        ],
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        ui: { component: 'channel-email-input', tab: 'Email' },
      },
      {
        name: 'storeAddress',
        type: 'text',
        nullable: true,
        public: true,
        label: [
          { languageCode: LanguageCode.en, value: 'Store address' },
          { languageCode: LanguageCode.pt, value: 'Morada da loja' },
        ],
        ui: { tab: 'Email', component: 'rich-text-form-input' },
      },
      {
        name: 'channelDomain',
        type: 'string',
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Channel domain' },
          { languageCode: LanguageCode.pt, value: 'Domínio do canal' },
        ],
        validate: (value: unknown) => {
          if (value == null || value === '') return;
          if (typeof value !== 'string' || !DOMAIN_REGEX.test(value)) {
            return 'Channel domain must be a valid domain (without protocol)';
          }
        },
        ui: { tab: 'Domain and TLS' },
      },
      {
        name: 'certificateProvider',
        type: 'string',
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Certificate provider' },
          { languageCode: LanguageCode.pt, value: 'Fornecedor do certificado' },
        ],
        ui: { tab: 'Domain and TLS' },
      },
      {
        name: 'certificateRef',
        type: 'string',
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Certificate reference' },
          { languageCode: LanguageCode.pt, value: 'Referência do certificado' },
        ],
        ui: { tab: 'Domain and TLS' },
      },
      {
        name: 'certificateStatus',
        type: 'string',
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Certificate status' },
          { languageCode: LanguageCode.pt, value: 'Estado do certificado' },
        ],
        ui: { tab: 'Domain and TLS' },
      },
      {
        name: 'tlsEnforced',
        type: 'boolean',
        nullable: true,
        public: false,
        label: [
          { languageCode: LanguageCode.en, value: 'Force HTTPS (TLS)' },
          { languageCode: LanguageCode.pt, value: 'Forçar HTTPS (TLS)' },
        ],
        ui: { tab: 'Domain and TLS' },
      },
    );

    return config;
  },
  compatibility: '^3.0.0',
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [ChannelPersonalizationResolver],
  },
  dashboard: './dashboard/index.tsx',
})
export class ChannelPersonalizationPlugin {
  static init(): Type<ChannelPersonalizationPlugin> {
    return ChannelPersonalizationPlugin;
  }
}
