import { defineConfig } from '@lingui/cli';

const projectCatalogs = {
  evora: [],
  alcobaca: [],
  setubal: [
    {
      path: './src/plugins/setubal/geoanalitycs-plugin/dashboard/i18n/{locale}',
      include: ['./src/plugins/setubal/geoanalitycs-plugin/dashboard/**'],
    },
  ],
  nobrinde: [
    {
      path: './src/plugins/nobrinde/budget/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/budget/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/channel-personalization/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/channel-personalization/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/custom-cms-plugin/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/custom-cms-plugin/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/customer-support/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/customer-support/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/external-sync/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/external-sync/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/kits/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/kits/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/loyalty-points/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/loyalty-points/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/query-runner/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/query-runner/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/nobrinde-entity/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/nobrinde-entity/dashboard/**'],
    },
    {
      path: './src/plugins/nobrinde/user-credit/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/user-credit/dashboard/**'],
    },
  ],
};

const project = process.env.PROJECT_NAME ?? 'evora';

export default defineConfig({
  sourceLocale: 'en',
  // Add any locales you wish to support
  locales: ['en', 'pt_pt'],
  catalogs: projectCatalogs[project] ?? [],
});
