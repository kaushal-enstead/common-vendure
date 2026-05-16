import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import {
  CUSTOMER_SUPPORT_PLUGIN_OPTIONS,
  SupportSubjectPermissions,
  SupportTicketPermissions,
} from './constants';
import { PluginInitOptions } from './types';
import { SupportSubject } from './entities/support-subject.entity';
import { SupportSubjectTranslation } from './entities/support-subject-translation.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportSubjectService } from './services/support-subject.service';
import { SupportTicketService } from './services/support-ticket.service';
import { adminApiExtensions, shopApiExtensions } from './api/api-extensions';
import { SupportSubjectResolver } from './api/support-subject.resolver';
import { SupportSubjectShopResolver } from './api/support-subject-shop.resolver';
import { SupportTicketShopResolver } from './api/support-ticker-shop.resolver';
import { SupportTicketResolver } from './api/support-ticket.resolver';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: CUSTOMER_SUPPORT_PLUGIN_OPTIONS, useFactory: () => CustomerSupportPlugin.options },
    SupportSubjectService,
    SupportTicketService,
  ],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [SupportSubjectResolver, SupportTicketResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [SupportTicketShopResolver, SupportSubjectShopResolver],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(SupportTicketPermissions, SupportSubjectPermissions);
    return config;
  },
  compatibility: '^3.0.0',
  entities: [SupportSubject, SupportSubjectTranslation, SupportTicket],
  dashboard: './dashboard/index.tsx',
})
export class CustomerSupportPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<CustomerSupportPlugin> {
    this.options = options;
    return CustomerSupportPlugin;
  }
}
