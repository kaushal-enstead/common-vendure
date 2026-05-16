import { CrudPermissionDefinition } from '@vendure/core';

export const PRE_ORDER_INQUIRY_PLUGIN_OPTIONS = Symbol('PRE_ORDER_INQUIRY_PLUGIN_OPTIONS');
export const loggerCtx = 'PreOrderInquiryPlugin';

export const preOrderPermissions = new CrudPermissionDefinition('PreOrder');
