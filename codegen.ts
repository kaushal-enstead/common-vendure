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
    'src/plugins/nobrinde/customer-support/gql/generated.ts': {
      ...pluginConfig,
      documents: [
        'src/plugins/nobrinde/budget/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/channel-personalization/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/custom-cms-plugin/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/customer-support/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/easypay-plugin/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/external-sync/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/kits/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/loyalty-points/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/nobrinde-entity/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/qr-code/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/user-credit/dashboard/**/*.graphql.ts',
        'src/plugins/nobrinde/wire-transfer/dashboard/**/*.graphql.ts',
      ],
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
