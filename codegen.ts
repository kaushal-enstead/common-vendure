import type { CodegenConfig } from '@graphql-codegen/cli';

const pluginConfig = {
  plugins: ['typescript'] as string[],
};

const projectGenerates: Record<string, CodegenConfig['generates']> = {
  evora: {
    'src/plugins/common/booking-plugin/gql/generated.ts': {
      ...pluginConfig,
    },
    // 'src/plugins/common/custom-customer-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/custom-facet-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/custom-product-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/custom-seller-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/file-cache-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/geoanalytics-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/loyalty-points-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/marketplace-api-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/multivendor-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/pre-order-inquiry-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/promotion-extension-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/qr-code/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/query-runner/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/review-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/shared-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
    // 'src/plugins/common/wishlist-plugin/gql/generated.ts': {
    //   ...pluginConfig,
    // },
  },
  alcobaca: {},
  setubal: {
    'src/plugins/setubal/geoanalitycs-plugin/gql/generated.ts': {
      ...pluginConfig,
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
    scalars: { Money: 'number', DateTime: Date },
    // This ensures generated enums do not conflict with the built-in types.
    namingConvention: { enumValues: 'keep' },
  },
  generates: projectGenerates[project] ?? {},
};

export default config;
