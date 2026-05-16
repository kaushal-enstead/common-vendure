import { defineDashboardExtension } from '@vendure/dashboard';
import { supportSubjectList } from './routes/subject/subjects';
import { supportSubjectDetail } from './routes/subject/subjects_.$id';
import { Ticket } from 'lucide-react';
import { supportTicketList } from './routes/ticket/tickets';
import { supportTicketDetail } from './routes/ticket/tickets_.$id';

export default defineDashboardExtension({
  routes: [supportTicketDetail, supportTicketList, supportSubjectList, supportSubjectDetail],
  navSections: [
    {
      id: 'support',
      title: 'Support',
      icon: Ticket,
      // order: 100,
    },
  ],
  pageBlocks: [],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {},
  dataTables: [],
  detailForms: [],
  login: {},
});
