import { Badge, DashboardRouteDefinition, DetailPageButton, ListPage } from '@vendure/dashboard';
import { deleteSupportTicketDocument, supportTicketListDocument } from './tickets.graphql';
import { ComponentProps } from 'react';
// import { DeleteSupportSubjectsBulkAction } from './components/delete-supports-bulk';

const pageId = 'support-ticket-list';

export const supportTicketList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'support',
    id: 'support-tickets',
    url: '/support-tickets',
    title: 'Tickets',
  },
  path: '/support-tickets',
  loader: () => ({
    breadcrumb: 'Tickets',
  }),
  component: route => (
    <ListPage
      pageId={pageId}
      title="Tickets"
      onSearchTermChange={searchTerm => {
        return {
          description: {
            contains: searchTerm,
          },
          status: {
            contains: searchTerm,
          },
          priority: {
            contains: searchTerm,
          },
        };
      }}
      transformVariables={variables => {
        return {
          options: {
            ...variables.options,
            filterOperator: 'OR',
          },
        };
      }}
      listQuery={supportTicketListDocument}
      deleteMutation={deleteSupportTicketDocument}
      route={route}
      customizeColumns={{
        id: {
          header: 'ID',
          cell: ({ row }) => {
            const ticket = row.original;
            return (
              <div className="max-w-24 truncate">
                <DetailPageButton id={ticket.id} label={ticket.id} />
              </div>
            );
          },
        },
        channel: {
          header: 'Channel',
          cell: ({ row }) => {
            const ticket = row.original.channel;
            return (
              <DetailPageButton href={`/channels/${ticket.id}`} id={ticket.id} label={ticket.seller.name} />
            );
          },
        },
        customer: {
          header: 'Customer',
          cell: ({ row }) => {
            const value = `${row.original.customer.firstName} ${row.original.customer.lastName}`;
            return (
              <DetailPageButton
                href={`/customers/${row.original.customer.id}`}
                id={row.original.id}
                label={value}
              />
            );
          },
        },
        subject: {
          header: 'Subject',
          cell: ({ row }) => {
            const ticket = row.original;
            return (
              <DetailPageButton
                href={`/support-subjects/${ticket.subject.id}`}
                id={ticket.id}
                label={ticket.subject.name}
              />
            );
          },
        },
        status: {
          header: 'Status',
          cell: ({ row }) => {
            const ticket = row.original;
            const map: Record<string, ComponentProps<typeof Badge>['variant']> = {
              OPEN: 'destructive',
              CLOSED: 'success',
              PENDING: 'secondary',
            };
            return (
              <Badge variant={map[ticket.status] ?? 'outline'} className="uppercase">
                {ticket.status}
              </Badge>
            );
          },
        },
        priority: {
          header: 'Priority',
          cell: ({ row }) => {
            const ticket = row.original;
            const map: Record<string, ComponentProps<typeof Badge>['variant']> = {
              LOW: 'outline',
              MEDIUM: 'success',
              HIGH: 'secondary',
              URGENT: 'destructive',
            };
            return (
              <Badge variant={map[ticket.priority] ?? 'outline'} className="uppercase">
                {ticket.priority}
              </Badge>
            );
          },
        },
        description: {
          header: 'Description',
          cell: ({ row }) => {
            const ticket = row.original;
            return <span className="truncate max-w-48">{ticket.description}</span>;
          },
        },
      }}
      defaultColumnOrder={['id', 'subject', 'customer', 'channel', 'status', 'priority', 'description']}
      defaultVisibility={{
        id: true,
        createdAt: false,
        updatedAt: false,
        subject: true,
        customer: true,
        channel: true,
        status: true,
        priority: true,
        description: true,
        messages: false,
      }}
      // bulkActions={[
      //   {
      //     component: DeleteSupportSubjectsBulkAction,
      //     order: 500,
      //   },
      // ]}
    ></ListPage>
  ),
};
