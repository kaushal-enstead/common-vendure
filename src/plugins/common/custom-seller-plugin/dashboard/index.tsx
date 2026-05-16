import { defineDashboardExtension } from '@vendure/dashboard';
// import { t } from '@lingui/core/macro';

import { SellerDaysInput } from './components/days-input';
import { SellerApprovalStatusCell } from './components/seller-approval-status-cell';
import { SellerCollectionBlock } from './components/seller-collection-block';
import { SellerStructDaysInput } from './components/struct-days-input';
import { ChannelColorPicker } from './components/channel-color-picker';
import { FontFamilySelect } from './components/font-family-select';

defineDashboardExtension({
    dataTables: [
        {
            pageId: 'seller-list',
            extendListDocument: `
                query SellerListApprovalStatusExtension {
                    sellers {
                        items {
                            customFields {
                                status
                            }
                        }
                    }
                }
            `,
            displayComponents: [{ column: 'status', component: SellerApprovalStatusCell }],
        },
    ],
    customFormComponents: {
        customFields: [
            { id: 'days-input', component: SellerDaysInput },
            { id: 'struct-days-input', component: SellerStructDaysInput },
            { id: 'channel-color-picker',component: ChannelColorPicker },
            { id: 'channel-font-family-select',component: FontFamilySelect },
        ],
    },
    pageBlocks: [
        {
            id: 'seller-collection-picker',
            title: `Collection`,
            location: {
                pageId: 'seller-detail',
                column: 'side',
                position: { blockId: 'custom-fields', order: 'after' },
            },
            component: SellerCollectionBlock,
        },
    ],
});
