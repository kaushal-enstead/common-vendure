import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  EventBus,
  PaymentStateTransitionEvent,
  TransactionalConnection,
  Logger,
  EntityHydrator,
  OrderService,
} from '@vendure/core';
import { UserCreditService } from '../services/user-credit.service';
import { userCreditPaymentMethodCode } from '../constants';
import { loggerCtx } from '../constants';

@Injectable()
export class UserCreditPaymentListener implements OnModuleInit {
  constructor(
    private eventBus: EventBus,
    private userCreditService: UserCreditService,
    private connection: TransactionalConnection,
    private entityHydrator: EntityHydrator,
    private orderService: OrderService,
  ) {}

  onModuleInit() {
    this.eventBus.ofType(PaymentStateTransitionEvent).subscribe({
      next: async event => {
        try {
          const { ctx: outerCtx, payment, toState } = event;
          // Only process when payment is settled
          if (toState !== 'Settled') {
            return;
          }

          // Hydrate payment to get payment method relation
          await this.entityHydrator.hydrate(outerCtx, payment, {
            relations: ['order.payments'],
          });

          // Check if this is a user-credit payment
          const paymentMethodCode =
            typeof payment.method === 'string' ? payment.method : payment?.order?.payments?.[0]?.method;

          if (paymentMethodCode !== userCreditPaymentMethodCode) {
            return;
          }

          // Get the order to find the customer
          const order = payment.order;
          if (!order || !order.customerId) {
            Logger.warn(`Order or customer not found for payment ${payment.id}`, loggerCtx);
            return;
          }

          await this.connection.withTransaction(outerCtx, async ctx => {
            // Update value_used when payment is settled
            const amount = payment.amount / 100;
            await this.userCreditService.updateValueUsed(ctx, order.customerId as string, amount);
            await this.orderService.addNoteToOrder(ctx, {
              id: order.id,
              isPublic: false,
              note: `Payment ${payment.id} was settled using user credit. Credits used: ${amount}`,
            });
            Logger.info(
              `Updated value_used for customer ${order.customerId} after payment ${payment.id} was settled`,
              'UserCreditPaymentListener',
            );
          });
        } catch (error) {
          Logger.error(`UserCreditPaymentListener failed: ${error}`, 'UserCreditPaymentListener');
        }
      },
      error: err => {
        Logger.error('UserCreditPaymentListener subscription failed: ' + err, 'UserCreditPaymentListener');
      },
    });
  }
}
