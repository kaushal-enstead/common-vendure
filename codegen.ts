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
    './src/plugins/budget/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/channel-personalization/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/custom-cms-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/custom-shipping-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/customer-support/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/easypay-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/external-sync/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/loyalty-points/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/kits/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/nobrinde-entity/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/qr-code/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/quantity-pricing/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/query-runner/gql/generated.ts': {
      ...pluginConfig,
    },
    './src/plugins/user-credit/gql/generated.ts': {
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
