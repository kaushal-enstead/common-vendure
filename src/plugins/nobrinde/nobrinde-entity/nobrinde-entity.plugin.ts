import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import {
  NobrindeBudgetPermissions,
  NobrindeChannelPermissions,
  NobrindeOrderPermissions,
  NobrindeSaleUserPermissions,
} from './constants';
import { adminApiExtensions } from './api/api-extensions';
import { NobrindeBudgetResolver } from './api/budget/nobrinde-budget.resolver';
import { NobrindeBudgetEntityResolver } from './api/budget/nobrinde-budget-entity.resolver';
import { NobrindeBudgetLineEntityResolver } from './api/budget/nobrinde-budget-line-entity.resolver';
import { NobrindeChannelResolver } from './api/channel/nobrinde-channel.resolver';
import { NobrindeOrderResolver } from './api/order/nobrinde-order.resolver';
import { NobrindeOrderEntityResolver } from './api/order/nobrinde-order-entity.resolver';
import { NobrindeOrderLineEntityResolver } from './api/order/nobrinde-order-line-entity.resolver';
import { NobrindeSaleUserResolver } from './api/sale-user/nobrinde-sale-user.resolver';
import { NobrindeBudgetService } from './services/nobrinde-budget.service';
import { NobrindeChannelService } from './services/nobrinde-channel.service';
import { NobrindeOrderService } from './services/nobrinde-order.service';
import { NobrindeSaleUserService } from './services/nobrinde-sale-user.service';
import { PluginInitOptions } from './types';
import { NobrindeSaleUser } from './entities/nobrinde-sale-users';
import { NobrindeChannel } from './entities/nobrinde-channels';
import { NobrindeBudget, NobrindeBudgetLine } from './entities/nobrinde-budgets';
import { NobrindeOrder, NobrindeOrderLine } from './entities/nobrinde-orders';
@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [NobrindeBudgetService, NobrindeChannelService, NobrindeOrderService, NobrindeSaleUserService],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [
      NobrindeBudgetResolver,
      NobrindeBudgetEntityResolver,
      NobrindeBudgetLineEntityResolver,
      NobrindeChannelResolver,
      NobrindeOrderResolver,
      NobrindeOrderEntityResolver,
      NobrindeOrderLineEntityResolver,
      NobrindeSaleUserResolver,
    ],
  },
  configuration: config => {
    config.authOptions.customPermissions.push(
      NobrindeBudgetPermissions,
      NobrindeChannelPermissions,
      NobrindeOrderPermissions,
      NobrindeSaleUserPermissions,
    );
    return config;
  },
  entities: [
    NobrindeSaleUser,
    NobrindeChannel,
    NobrindeBudget,
    NobrindeBudgetLine,
    NobrindeOrder,
    NobrindeOrderLine,
  ],
  compatibility: '^3.0.0',
  dashboard: './dashboard/index.tsx',
})
export class NobrindeEntityPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<NobrindeEntityPlugin> {
    this.options = options;
    return NobrindeEntityPlugin;
  }
}
