import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dashboard',
  build: {
    outDir: join(__dirname, 'dist/dashboard'),
  },
  plugins: [
    vendureDashboardPlugin({
      // The vendureDashboardPlugin will scan your configuration in order
      // to find any plugins which have dashboard extensions, as well as
      // to introspect the GraphQL schema based on any API extensions
      // and custom fields that are configured.
      vendureConfigPath: pathToFileURL('./src/vendure-config.ts'),
      // Points to the location of your Vendure server.
      // In production, 'auto' lets the dashboard derive the API URL from the
      // server that serves it. In development, we use explicit defaults so that
      // the Vite dev server can reach the Vendure backend.
      api:
        process.env.NODE_ENV === 'production'
          ? { host: 'auto', port: 'auto' }
          : { host: 'http://localhost', port: 3000 },
      // When you start the Vite server, your Admin API schema will
      // be introspected and the types will be generated in this location.
      // These types can be used in your dashboard extensions to provide
      // type safety when writing queries and mutations.
      gqlOutputPath: './src/gql',
      // Theme section
      // https://docs.vendure.io/guides/extending-the-dashboard/theming/#available-theme-variables
      theme: {
        // light: {
        //   primary: 'oklch(0.55 0.18 240)',
        //   'primary-foreground': 'oklch(0.98 0.01 240)',
        //   brand: '#2563eb', // Blue-600
        //   'brand-lighter': '#93c5fd', // Blue-300
        // },
        // dark: {
        //   primary: 'oklch(0.65 0.16 240)',
        //   'primary-foreground': 'oklch(0.12 0.03 240)',
        //   brand: '#2563eb',
        //   'brand-lighter': '#93c5fd',
        // },
      },
    }),
  ],
  resolve: {
    alias: {
      // This allows all plugins to reference a shared set of
      // GraphQL types.
      '@/gql': resolve(__dirname, './src/gql/graphql.ts'),
    },
  },
});
