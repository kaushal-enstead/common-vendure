import { LanguageCode, PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { SharedPlugin } from '../shared-plugin/shared-plugin';
import { shopApiExtensions } from './api/api-extensions';
import { CustomCustomerShopResolver } from './api/custom-customer-shop.resolver';
import { CUSTOM_CUSTOMER_PLUGIN_OPTIONS } from './constants';
import { CustomCustomerService } from './services/custom-customer.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
  imports: [PluginCommonModule, SharedPlugin],
  providers: [
    {
      provide: CUSTOM_CUSTOMER_PLUGIN_OPTIONS,
      useFactory: () => CustomCustomerPlugin.options,
    },
    CustomCustomerService,
    CustomCustomerShopResolver,
  ],
  configuration: config => {
    config.customFields.Customer.push(
      {
        name: 'vatNumber',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'VAT' },
          { languageCode: LanguageCode.pt, value: 'NIF' },
          { languageCode: LanguageCode.pt_PT, value: 'NIF' },
        ],
        pattern: '^[A-Za-z0-9]{9,}$',
        description: [
          { languageCode: LanguageCode.en, value: 'Minimum 9 characters. Letters and numbers allowed.' },
          { languageCode: LanguageCode.pt, value: 'Mínimo 9 caracteres. Letras e números permitidos.' },
          { languageCode: LanguageCode.pt_PT, value: 'Mínimo 9 caracteres. Letras e números permitidos.' },
        ],
      },
      {
        name: 'gender',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Gender' },
          { languageCode: LanguageCode.pt, value: 'Género' },
          { languageCode: LanguageCode.pt_PT, value: 'Género' },
        ],
        ui: {
          component: 'select-form-input',
          options: [
            {
              value: 'male',
              label: [
                { languageCode: LanguageCode.en, value: 'Male' },
                { languageCode: LanguageCode.pt, value: 'Masculino' },
                { languageCode: LanguageCode.pt_PT, value: 'Masculino' },
              ],
            },
            {
              value: 'female',
              label: [
                { languageCode: LanguageCode.en, value: 'Female' },
                { languageCode: LanguageCode.pt, value: 'Feminino' },
                { languageCode: LanguageCode.pt_PT, value: 'Feminino' },
              ],
            },
            {
              value: 'other',
              label: [
                { languageCode: LanguageCode.en, value: 'Other' },
                { languageCode: LanguageCode.pt, value: 'Outro' },
                { languageCode: LanguageCode.pt_PT, value: 'Outro' },
              ],
            },
          ],
        },
      },
      {
        name: 'dateOfBirth',
        type: 'datetime',
        label: [
          { languageCode: LanguageCode.en, value: 'Date of Birth' },
          { languageCode: LanguageCode.pt, value: 'Data de Nascimento' },
          { languageCode: LanguageCode.pt_PT, value: 'Data de Nascimento' },
        ],
        ui: { component: 'date-form-input' },
      },
      {
        name: 'acceptTermsAndConditions',
        type: 'boolean',
        label: [
          { languageCode: LanguageCode.en, value: 'Accept Terms and Conditions' },
          { languageCode: LanguageCode.pt, value: 'Aceitar Termos e Condições' },
          { languageCode: LanguageCode.pt_PT, value: 'Aceitar Termos e Condições' },
        ],
        defaultValue: false,
      },
      {
        name: 'marketingOptIn',
        type: 'boolean',
        label: [
          { languageCode: LanguageCode.en, value: 'Marketing Opt-In' },
          { languageCode: LanguageCode.pt, value: 'Preferências de Marketing' },
          { languageCode: LanguageCode.pt_PT, value: 'Preferências de Marketing' },
        ],
        defaultValue: false,
      },
    );
    // config.customFields.Address.push(...addressCustomFields);
    return config;
  },
  compatibility: '^3.0.0',
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [CustomCustomerShopResolver],
  },
})
export class CustomCustomerPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<CustomCustomerPlugin> {
    this.options = options;
    return CustomCustomerPlugin;
  }
}
