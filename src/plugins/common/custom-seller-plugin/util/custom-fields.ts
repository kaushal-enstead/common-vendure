import { Asset, CustomFields, FacetValue, Permission, StructFieldConfig } from '@vendure/core';
import { validateLatitude, validateLongitude } from './validator';
import { timeOptions } from './options';
import { LanguageCode } from '@vendure/core';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
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

const localizedTextFields: StructFieldConfig[] = [
  { name: LanguageCode.en, type: 'text' },
  { name: LanguageCode.pt, type: 'text' },
];

const companyAndAddressFields: Exclude<CustomFields['Seller'], undefined> = [
  {
    name: 'company',
    type: 'struct',
    fields: [
      {
        name: 'companyName',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Company Name' },
          { languageCode: LanguageCode.pt, value: 'Nome da Empresa' },
          { languageCode: LanguageCode.pt_PT, value: 'Nome da Empresa' },
        ],
      },
      {
        name: 'companyBrand',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Company Brand' },
          { languageCode: LanguageCode.pt, value: 'Marca da Empresa' },
          { languageCode: LanguageCode.pt_PT, value: 'Marca da Empresa' },
        ],
      },
    ],
    ui: { tab: 'Company & Addr' },
  },
  {
    name: 'contact',
    type: 'struct',
    fields: [
      {
        name: 'contactName',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Contact Name' },
          { languageCode: LanguageCode.pt, value: 'Nome do Contacto' },
          { languageCode: LanguageCode.pt_PT, value: 'Nome do Contacto' },
        ],
      },
      {
        name: 'contactEmail',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Contact Email' },
          { languageCode: LanguageCode.pt, value: 'Email do Contacto' },
          { languageCode: LanguageCode.pt_PT, value: 'Email do Contacto' },
        ],
      },
      {
        name: 'contactPhone',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Contact Phone/Mobile' },
          { languageCode: LanguageCode.pt, value: 'Telefone/Telemóvel do Contacto' },
          { languageCode: LanguageCode.pt_PT, value: 'Telefone/Telemóvel do Contacto' },
        ],
        pattern: '^\\d{9}$',
        description: [
          { languageCode: LanguageCode.en, value: 'Number must contain 9 digits.' },
          { languageCode: LanguageCode.pt, value: 'Número deve ter 9 dígitos.' },
          { languageCode: LanguageCode.pt_PT, value: 'Número deve ter 9 dígitos.' },
        ],
      },
    ],
    label: [
      { languageCode: LanguageCode.en, value: 'Contact' },
      { languageCode: LanguageCode.pt, value: 'Contacto' },
      { languageCode: LanguageCode.pt_PT, value: 'Contacto' },
    ],
    ui: { tab: 'Company & Addr' },
  },
  {
    name: 'address',
    type: 'struct',
    fields: [
      {
        name: 'street',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Street' },
          { languageCode: LanguageCode.pt, value: 'Rua' },
          { languageCode: LanguageCode.pt_PT, value: 'Rua' },
        ],
      },
      {
        name: 'streetLine2',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Street Line 2' },
          { languageCode: LanguageCode.pt, value: 'Rua Line 2' },
          { languageCode: LanguageCode.pt_PT, value: 'Rua Line 2' },
        ],
      },
      {
        name: 'city',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'City' },
          { languageCode: LanguageCode.pt, value: 'Cidade' },
          { languageCode: LanguageCode.pt_PT, value: 'Cidade' },
        ],
      },
      {
        name: 'postalCode',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Postal Code' },
          { languageCode: LanguageCode.pt, value: 'Código Postal' },
          { languageCode: LanguageCode.pt_PT, value: 'Código Postal' },
        ],
        pattern: '^\\d{4}-\\d{3}$',
        description: [
          { languageCode: LanguageCode.en, value: 'Format must be: 1234-123' },
          { languageCode: LanguageCode.pt, value: 'Formato obrigatório: 1234-123' },
          { languageCode: LanguageCode.pt_PT, value: 'Formato obrigatório: 1234-123' },
        ],
      },
      {
        name: 'country',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Country' },
          { languageCode: LanguageCode.pt, value: 'País' },
          { languageCode: LanguageCode.pt_PT, value: 'País' },
        ],
        ui: { component: 'country-input' },
      },
      {
        name: 'latitude',
        type: 'float',
        label: [
          { languageCode: LanguageCode.en, value: 'Latitude' },
          { languageCode: LanguageCode.pt, value: 'Latitude' },
        ],
        validate: validateLatitude,
      },
      {
        name: 'longitude',
        type: 'float',
        label: [
          { languageCode: LanguageCode.en, value: 'Longitude' },
          { languageCode: LanguageCode.pt, value: 'Longitude' },
          { languageCode: LanguageCode.pt_PT, value: 'Longitude' },
        ],
        validate: validateLongitude,
      },
    ],
    label: [
      { languageCode: LanguageCode.en, value: 'Address' },
      { languageCode: LanguageCode.pt, value: 'Morada' },
      { languageCode: LanguageCode.pt_PT, value: 'Morada' },
    ],
    description: [
      { languageCode: LanguageCode.en, value: 'Seller address' },
      { languageCode: LanguageCode.pt, value: 'Morada do vendedor' },
      { languageCode: LanguageCode.pt_PT, value: 'Morada do vendedor' },
    ],
    ui: { tab: 'Company & Addr' },
  },
];

const shopManagementFields: Exclude<CustomFields['Seller'], undefined> = [
  {
    name: 'logo',
    type: 'relation',
    entity: Asset,
    label: [
      { languageCode: LanguageCode.en, value: 'Logo' },
      { languageCode: LanguageCode.pt, value: 'Logótipo' },
      { languageCode: LanguageCode.pt_PT, value: 'Logótipo' },
    ],
    ui: { tab: 'Shop info', component: 'asset-picker-form-input' },
  },
  {
    name: 'banner',
    type: 'relation',
    list: true,
    entity: Asset,
    label: [
      { languageCode: LanguageCode.en, value: 'Banner' },
      { languageCode: LanguageCode.pt, value: 'Fundo' },
      { languageCode: LanguageCode.pt_PT, value: 'Fundo' },
    ],
    ui: { tab: 'Shop info', component: 'asset-picker-form-input' },
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
    ui: { tab: 'Shop info' },
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
    ui: { tab: 'Shop info' },
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
    ui: { component: 'channel-font-family-select', tab: 'Shop info' },
  },
  {
    name: 'shopDescription',
    type: 'struct',
    fields: localizedTextFields,
    label: [
      { languageCode: LanguageCode.en, value: 'Shop Description' },
      { languageCode: LanguageCode.pt, value: 'Descrição da Loja' },
      { languageCode: LanguageCode.pt_PT, value: 'Descrição da Loja' },
    ],
    ui: { tab: 'Shop info' },
  },
  {
    name: 'privacyPolicy',
    type: 'struct',
    fields: localizedTextFields,
    label: [
      { languageCode: LanguageCode.en, value: 'Privacy Policy' },
      { languageCode: LanguageCode.pt, value: 'Política de Privacidade' },
      { languageCode: LanguageCode.pt_PT, value: 'Política de Privacidade' },
    ],
    ui: { tab: 'Shop info' },
  },
  {
    name: 'shippingPolicy',
    type: 'struct',
    fields: localizedTextFields,
    label: [
      { languageCode: LanguageCode.en, value: 'Shipping Policy' },
      { languageCode: LanguageCode.pt, value: 'Política de Envio' },
      { languageCode: LanguageCode.pt_PT, value: 'Política de Envio' },
    ],
    ui: { tab: 'Shop info' },
  },
  {
    name: 'returnPolicy',
    type: 'struct',
    fields: localizedTextFields,
    label: [
      { languageCode: LanguageCode.en, value: 'Return Policy' },
      { languageCode: LanguageCode.pt, value: 'Política de Devolução' },
      { languageCode: LanguageCode.pt_PT, value: 'Política de Devolução' },
    ],
    ui: { tab: 'Shop info' },
  },
  {
    name: 'hours',
    type: 'struct',
    list: true,
    label: [
      { languageCode: LanguageCode.en, value: 'Hours' },
      { languageCode: LanguageCode.pt, value: 'Horas' },
      { languageCode: LanguageCode.pt_PT, value: 'Horas' },
    ],
    fields: [
      {
        name: 'day',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Day' },
          { languageCode: LanguageCode.pt, value: 'Dia' },
          { languageCode: LanguageCode.pt_PT, value: 'Dia' },
        ],
      },
      {
        name: 'openingHour',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Opening Hour' },
          { languageCode: LanguageCode.pt, value: 'Horário de Abertura' },
          { languageCode: LanguageCode.pt_PT, value: 'Horário de Abertura' },
        ],
      },
      {
        name: 'closingHour',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Closing Hour' },
          { languageCode: LanguageCode.pt, value: 'Horário de Encerramento' },
          { languageCode: LanguageCode.pt_PT, value: 'Horário de Encerramento' },
        ],
      },
    ],
    ui: { tab: 'Shop info', component: 'struct-days-input', fullWidth: true },
  },
  {
    name: 'isFeatured',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'Is Featured' },
      { languageCode: LanguageCode.pt, value: 'Em Destaque' },
      { languageCode: LanguageCode.pt_PT, value: 'Em Destaque' },
    ],
    description: [
      { languageCode: LanguageCode.en, value: 'Whether this seller is featured on the main page.' },
      { languageCode: LanguageCode.pt, value: 'Se este vendedor está destacado na página principal.' },
      { languageCode: LanguageCode.pt_PT, value: 'Se este vendedor está destacado na página principal.' },
    ],
    ui: { tab: 'Shop info' },
    requiresPermission: [Permission.SuperAdmin],
  },
  {
    name: 'acceptTerms',
    type: 'boolean',
    label: [
      { languageCode: LanguageCode.en, value: 'Accept Terms' },
      { languageCode: LanguageCode.pt, value: 'Aceitar Termos' },
      { languageCode: LanguageCode.pt_PT, value: 'Aceitar Termos' },
    ],
    description: [
      { languageCode: LanguageCode.en, value: 'Whether the seller accepts terms and conditions.' },
      { languageCode: LanguageCode.pt, value: 'Se o vendedor aceita termos e condições.' },
      { languageCode: LanguageCode.pt_PT, value: 'Se o vendedor aceita termos e condições.' },
    ],
    ui: { tab: 'Shop info' },
  },
];

const approvalStatusFields: Exclude<CustomFields['Seller'], undefined> = [
  {
    name: 'status',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Approval Status' },
      { languageCode: LanguageCode.pt, value: 'Estado de Aprovação' },
      { languageCode: LanguageCode.pt_PT, value: 'Estado de Aprovação' },
    ],
    defaultValue: 'Pending',
    ui: {
      tab: 'Approval Status',
      component: 'select-form-input',
      options: [
        { languageCode: LanguageCode.en, value: 'Pending' },
        { languageCode: LanguageCode.pt, value: 'Pendente' },
        { languageCode: LanguageCode.pt_PT, value: 'Pendente' },
      ],
    },
    requiresPermission: [Permission.SuperAdmin],
  },
  {
    name: 'rejectReason',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Reject Reason' },
      { languageCode: LanguageCode.pt, value: 'Motivo de Rejeição' },
      { languageCode: LanguageCode.pt_PT, value: 'Motivo de Rejeição' },
    ],
    ui: { tab: 'Approval Status' },
    requiresPermission: [Permission.SuperAdmin],
  },
];

const socialDomainsFields: Exclude<CustomFields['Seller'], undefined> = [
  {
    name: 'socialDomains',
    type: 'struct',
    fields: [
      {
        name: 'facebookLink',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Facebook Link' },
          { languageCode: LanguageCode.pt, value: 'Link do Facebook' },
          { languageCode: LanguageCode.pt_PT, value: 'Link do Facebook' },
        ],
        ui: { prefix: 'https://' },
      },
      {
        name: 'instagramLink',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Instagram Link' },
          { languageCode: LanguageCode.pt, value: 'Link do Instagram' },
          { languageCode: LanguageCode.pt_PT, value: 'Link do Instagram' },
        ],
        ui: { prefix: 'https://' },
      },
      {
        name: 'twitterLink',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Twitter Link' },
          { languageCode: LanguageCode.pt, value: 'Link do Twitter' },
          { languageCode: LanguageCode.pt_PT, value: 'Link do Twitter' },
        ],
        ui: { prefix: 'https://' },
      },
      {
        name: 'linkedinLink',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'LinkedIn Link' },
          { languageCode: LanguageCode.pt, value: 'Link do LinkedIn' },
          { languageCode: LanguageCode.pt_PT, value: 'Link do LinkedIn' },
        ],
        ui: { prefix: 'https://' },
      },
      {
        name: 'websiteLink',
        type: 'string',
        label: [
          { languageCode: LanguageCode.en, value: 'Website Link' },
          { languageCode: LanguageCode.pt, value: 'Link do Website' },
          { languageCode: LanguageCode.pt_PT, value: 'Link do Website' },
        ],
        ui: { prefix: 'https://' },
      },
    ],
    ui: { tab: 'Social Domains' },
  },
];

export const sellerCustomFields: Exclude<CustomFields['Seller'], undefined> = [
  {
    name: 'createdBy',
    type: 'string',
    // type: "relation",
    // entity: Channel,
    ui: { component: 'channel-input' },
    label: [
      { languageCode: LanguageCode.en, value: 'Created By' },
      { languageCode: LanguageCode.pt, value: 'Criado por' },
      { languageCode: LanguageCode.pt_PT, value: 'Criado por' },
    ],
    requiresPermission: [Permission.SuperAdmin],
    defaultValue: 'vendor',
    public: true,
    // validate: (value: any) => {
    //   if (!value.startsWith("superadmin")) {
    //     return [
    //       {
    //         languageCode: LanguageCode.en,
    //         value: 'The Value must be superadmin"',
    //       },
    //       {
    //         languageCode: LanguageCode.pt,
    //         value: 'The Value must be superadmin"',
    //       },
    //       {
    //         languageCode: LanguageCode.pt_PT,
    //         value: 'The Value must be superadmin"',
    //       },
    //     ];
    //   }
    // },
  },
  {
    name: 'phone',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'Phone' },
      { languageCode: LanguageCode.pt, value: 'Telefone' },
      { languageCode: LanguageCode.pt_PT, value: 'Telefone' },
    ],
  },
  {
    name: 'vatNumber',
    type: 'string',
    label: [
      { languageCode: LanguageCode.en, value: 'VAT Number' },
      { languageCode: LanguageCode.pt, value: 'Número de IVA' },
      { languageCode: LanguageCode.pt_PT, value: 'Número de IVA' },
    ],
    pattern: '^[A-Za-z0-9]{9,}$',
    description: [
      { languageCode: LanguageCode.en, value: 'VAT number (e.g., 123456789)' },
      { languageCode: LanguageCode.pt, value: 'Número de IVA (ex: 123456789)' },
      { languageCode: LanguageCode.pt_PT, value: 'Número de IVA (ex: 123456789)' },
    ],
  },
  {
    name: 'collectionId',
    type: 'string',
    // readonly: true,
    // entity: Collection,
    label: [
      { languageCode: LanguageCode.en, value: 'Collection' },
      { languageCode: LanguageCode.pt, value: 'Coleção' },
      { languageCode: LanguageCode.pt_PT, value: 'Coleção' },
    ],
    description: [
      { languageCode: LanguageCode.en, value: 'The collection this seller belongs to.' },
      { languageCode: LanguageCode.pt, value: 'A coleção a que este vendedor pertence.' },
      { languageCode: LanguageCode.pt_PT, value: 'A coleção a que este vendedor pertence.' },
    ],
  },
  {
    name: 'facetValue',
    type: 'relation',
    entity: FacetValue,
    list: true,
    label: [
      { languageCode: LanguageCode.en, value: 'Facet Value' },
      { languageCode: LanguageCode.pt, value: 'Valor etiqueta' },
      { languageCode: LanguageCode.pt_PT, value: 'Valor etiqueta' },
    ],
    description: [
      { languageCode: LanguageCode.en, value: 'The facet value associated with this seller.' },
      { languageCode: LanguageCode.pt, value: 'O valor de faceta associado a este vendedor.' },
      { languageCode: LanguageCode.pt_PT, value: 'O valor de faceta associado a este vendedor.' },
    ],
    ui: { component: 'facet-value-form-input' },
  },
  ...companyAndAddressFields,
  ...shopManagementFields,
  ...socialDomainsFields,
  ...approvalStatusFields,
];
