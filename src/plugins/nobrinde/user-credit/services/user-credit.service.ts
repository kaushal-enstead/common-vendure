import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection, Customer, Logger } from '@vendure/core';
import { loggerCtx } from '../constants';

@Injectable()
export class UserCreditService {
  constructor(private connection: TransactionalConnection) {}

  /**
   * Update the value_used field when a payment is settled
   */
  async updateValueUsed(ctx: RequestContext, customerId: string, amount: number): Promise<void> {
    try {
      const customer = await this.connection.getRepository(ctx, Customer).findOne({
        where: { id: customerId },
      });

      if (!customer) {
        Logger.warn(`Customer ${customerId} not found`, loggerCtx);
        return;
      }

      const currentValueUsed = customer.customFields?.credits_used || 0;
      const newValueUsed = currentValueUsed + amount;

      await this.connection.getRepository(ctx, Customer).update(
        { id: customerId },
        {
          customFields: {
            ...customer.customFields,
            credits_used: newValueUsed,
          },
        },
      );

      Logger.info(
        `Updated value_used for customer ${customerId}: ${currentValueUsed} -> ${newValueUsed}`,
        loggerCtx,
      );
    } catch (error) {
      Logger.error(`Error updating value_used for customer ${customerId}: ${error}`, loggerCtx);
      throw error;
    }
  }

  /**
   * Get available credits for a customer
   */
  async getAvailableCredits(ctx: RequestContext, customerId: string): Promise<number> {
    try {
      const customer = await this.connection.getRepository(ctx, Customer).findOne({
        where: { id: customerId },
      });

      if (!customer) {
        return 0;
      }

      const credits = customer.customFields?.credits || 0;
      const creditsUsed = customer.customFields?.credits_used || 0;
      return credits - creditsUsed;
    } catch (error) {
      Logger.error(`Error getting available credits for customer ${customerId}: ${error}`, loggerCtx);
      return 0;
    }
  }
}
