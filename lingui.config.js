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
      path: './src/plugins/nobrinde/customer-support/dashboard/i18n/{locale}',
      include: ['./src/plugins/nobrinde/customer-support/dashboard/**'],
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
