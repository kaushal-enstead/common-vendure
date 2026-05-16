import type { CodegenConfig } from '@graphql-codegen/cli';

const pluginConfig = {
  plugins: ['typescript'] as string[],
};

const projectGenerates: Record<string, CodegenConfig['generates']> = {
  evora: {},
  alcobaca: {},
  setubal: {
    'src/plugins/setubal/geoanalitycs-plugin/gql/generated.ts': {
      ...pluginConfig,
      documents: ['src/plugins/setubal/geoanalitycs-plugin/dashboard/**/*.graphql.ts'],
    },
  },
  nobrinde: {
    './src/plugins/nobrinde/budget/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/channel-personalization/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/custom-cms-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/custom-shipping-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/customer-support/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/easypay-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/external-sync/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/loyalty-points/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/kits/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/nobrinde-entity/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/qr-code/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/quantity-pricing/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/query-runner/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde/user-credit/gql/generated.ts': {
      ...pluginConfig,
    },
  },
};

const project = process.env.PROJECT_NAME ?? 'evora';

const config: CodegenConfig = {
  overwrite: true,
  watch: false,
  // This assumes your server is running on the standard port
  // and with the default admin API path. Adjust accordingly.
  schema: 'http://localhost:3000/admin-api',
  config: {
    // This tells codegen that the `Money` scalar is a number
    scalars: { Money: 'number' },
    // This ensures generated enums do not conflict with the built-in types.
    namingConvention: { enumValues: 'keep' },
  },
  generates: projectGenerates[project] ?? {},
};

export default config;
