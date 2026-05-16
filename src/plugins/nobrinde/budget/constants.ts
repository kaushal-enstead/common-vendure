import { CrudPermissionDefinition } from '@vendure/core';

export const BUDGET_PLUGIN_OPTIONS = Symbol('BUDGET_PLUGIN_OPTIONS');
export const loggerCtx = 'BudgetPlugin';

export const BudgetPermissions = new CrudPermissionDefinition('Budget');
