import { defineConfig } from '@lingui/cli';

export default defineConfig({
  sourceLocale: 'en',
  // Add any locales you wish to support
  locales: ['en', 'pt_pt'],
  catalogs: [
    {
      path: './src/plugins/geoanalitycs-plugin/dashboard/i18n/{locale}',
      include: ['./src/plugins/geoanalitycs-plugin/dashboard/**'],
    },
  ],
});
