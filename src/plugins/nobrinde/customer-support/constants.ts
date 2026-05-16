import { CrudPermissionDefinition } from '@vendure/core';

export const CUSTOMER_SUPPORT_PLUGIN_OPTIONS = Symbol('CUSTOMER_SUPPORT_PLUGIN_OPTIONS');
export const loggerCtx = 'CustomerSupportPlugin';

export const SupportTicketPermissions = new CrudPermissionDefinition('SupportTicket');
export const SupportSubjectPermissions = new CrudPermissionDefinition('SupportSubject');
