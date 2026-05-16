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
      documents: ['src/plugins/nobrinde/customer-support/dashboard/**/*.graphql.ts'],
    },
  },
};

const project = process.env.PROJECT_NAME ?? 'evora';

console.log(`Generating GraphQL types for project: ${project}`, projectGenerates[project]);
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
