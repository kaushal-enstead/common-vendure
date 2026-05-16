import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { BUDGET_PLUGIN_OPTIONS, BudgetPermissions } from './constants';
import { PluginInitOptions } from './types';
import { Budget } from './entity/budget';
import { BudgetLine } from './entity/budget-line';
import { BudgetService } from './services/budget.service';
import { BudgetResolver } from './api/budget.resolver';
import { BudgetLineEntityResolver } from './api/budget-line.resolver';
import { adminApiExtensions } from './api/api-extensions';
import { BudgetModifier } from './services/budget-modifier';
import { BudgetEntityResolver } from './api/budget-entity.resolver';
import {
  UpdateBudgetItemsResultResolver,
  RemoveBudgetItemsResultResolver,
  SetBudgetShippingMethodResultResolver,
  SetCustomerForBudgetOrderResultResolver,
  ApplyCouponCodeToBudgetOrderResultResolver,
} from './api/custom-type.resolver';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [
    { provide: BUDGET_PLUGIN_OPTIONS, useFactory: () => BudgetPlugin.options },
    BudgetService,
    BudgetModifier,
  ],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [
      BudgetResolver,
      BudgetLineEntityResolver,
      BudgetEntityResolver,
      UpdateBudgetItemsResultResolver,
      RemoveBudgetItemsResultResolver,
      SetBudgetShippingMethodResultResolver,
      SetCustomerForBudgetOrderResultResolver,
      ApplyCouponCodeToBudgetOrderResultResolver,
    ],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(BudgetPermissions);
    return config;
  },
  compatibility: '^3.0.0',
  entities: [Budget, BudgetLine],
  dashboard: './dashboard/index.tsx',
})
export class BudgetPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<BudgetPlugin> {
    this.options = options;
    return BudgetPlugin;
  }
}
