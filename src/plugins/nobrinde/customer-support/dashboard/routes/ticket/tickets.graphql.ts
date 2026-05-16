import { graphql } from '@/gql';

const ticketFragment = graphql(`
  fragment TicketFragment on SupportTicket {
    id
    createdAt
    updatedAt
    description
    status
    priority
    customer {
      id
      title
      emailAddress
      firstName
      lastName
    }
    subject {
      id
      name
    }
    messages {
      id
      content
      sender
      timestamp
      ticketId
      senderId
    }
    channel {
      id
      code
      seller {
        id
        name
      }
    }
  }
`);

const supportTicketListDocument = graphql(
  `
    query SupportTickets($options: SupportTicketListOptions) {
      supportTickets(options: $options) {
        items {
          ...TicketFragment
        }
        totalItems
      }
    }
  `,
  [ticketFragment],
);

const supportTicketDetailDocument = graphql(
  `
    query SupportTicket($id: ID!) {
      supportTicket(id: $id) {
        ...TicketFragment
      }
    }
  `,
  [ticketFragment],
);

const deleteSupportTicketDocument = graphql(`
  mutation DeleteSupportTicket($id: ID!) {
    deleteSupportTicket(id: $id) {
      result
    }
  }
`);

const deleteSupportTicketsDocument = graphql(`
  mutation DeleteSupportTickets($ids: [ID!]!) {
    deleteSupportTickets(ids: $ids) {
      result
    }
  }
`);

const addSupportTicketMessageDocument = graphql(`
  mutation AddSupportTicketMessage($input: AddSupportTicketMessageInput!) {
    addSupportTicketMessage(input: $input) {
      id
      messages {
        id
        content
        sender
        timestamp
        ticketId
        senderId
      }
    }
  }
`);

const updateSupportTicketDocument = graphql(`
  mutation UpdateSupportTicket($input: UpdateSupportTicketInput!) {
    updateSupportTicket(input: $input) {
      id
    }
  }
`);

export {
  supportTicketListDocument,
  supportTicketDetailDocument,
  deleteSupportTicketDocument,
  deleteSupportTicketsDocument,
  addSupportTicketMessageDocument,
  updateSupportTicketDocument,
  ticketFragment,
};
