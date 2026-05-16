import { defineDashboardExtension } from '@vendure/dashboard';
import { ProductGenerateAllQrButton, ProductGenerateQrButton } from './components/product-qr-buttons';
import { ProductQrPreviewBlock, ProductVariantQrPreviewBlock } from './components/qr-preview-block';

export default defineDashboardExtension({
  pageBlocks: [
    {
      id: 'nobrinde-product-qr-preview',
      location: {
        pageId: 'product-detail',
        column: 'side',
        position: { blockId: 'assets', order: 'after' },
      },
      component: ProductQrPreviewBlock,
      shouldRender: ctx => Boolean(ctx.entity?.id),
    },
    {
      id: 'nobrinde-product-variant-qr-preview',
      location: {
        pageId: 'product-variant-detail',
        column: 'side',
        position: { blockId: 'assets', order: 'after' },
      },
      component: ProductVariantQrPreviewBlock,
      shouldRender: ctx => Boolean(ctx.entity?.id),
    },
  ],
  actionBarItems: [
    {
      pageId: 'product-detail',
      component: ({ context }) => <ProductGenerateQrButton context={context} />,
    },
    {
      pageId: 'product-detail',
      component: ({ context }) => <ProductGenerateAllQrButton context={context} />,
    },
  ],
});
