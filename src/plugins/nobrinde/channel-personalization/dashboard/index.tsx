import { defineDashboardExtension } from '@vendure/dashboard';
import { ChannelColorPicker } from './components/channel-color-picker';
import { EmailInputComponent } from './components/email-input-component';
import { FontFamilySelect } from './components/font-family-select';
import { EmailTemplateEditor } from './components/email-template-editor';

export default defineDashboardExtension({
  routes: [],
  navSections: [],
  pageBlocks: [],
  actionBarItems: [],
  alerts: [],
  widgets: [],
  customFormComponents: {
    customFields: [
      {
        id: 'channel-color-picker',
        component: ChannelColorPicker,
      },
      {
        id: 'channel-email-input',
        component: EmailInputComponent,
      },
      {
        id: 'channel-font-family-select',
        component: FontFamilySelect,
      },
      {
        id: 'channel-email-template-editor',
        component: EmailTemplateEditor,
      },
    ],
  },
  dataTables: [],
  detailForms: [],
  login: {},
});
