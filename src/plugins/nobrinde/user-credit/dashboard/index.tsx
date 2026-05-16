import { Badge, defineDashboardExtension } from '@vendure/dashboard';

export default defineDashboardExtension({
  routes: [],
  navSections: [],
  pageBlocks: [],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {},
  dataTables: [
    {
      pageId: 'order-list',
      blockId: 'list-table',
      extendListDocument: `
        query GetOrders($options: OrderListOptions) {
          orders(options: $options) {
            items {
              id
              code
              state
              customer {
                id
                firstName
                lastName
              }
              orderPlacedAt
              total
              currencyCode
              totalWithTax
              shippingLines {
                shippingMethod {
                  name
                }
              }
              payments {
                amount
                method 
              }
            }
            totalItems
          }
        }
      `,
      displayComponents: [
        {
          column: 'payments',
          component: ({ value, cell, row, table }) => {
            const paymentMethodCode = value?.[0]?.method;
            if (!paymentMethodCode) {
              return '-';
            }
            return (
              <Badge variant="outline" className="capitalize">
                {paymentMethodCode}
              </Badge>
            );
          },
        },
      ],
    },
  ],
  detailForms: [],
  login: {},
});
