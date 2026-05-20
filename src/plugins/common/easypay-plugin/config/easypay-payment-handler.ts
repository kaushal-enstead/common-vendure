import {
  LanguageCode,
  PaymentMethodHandler,
  CreatePaymentResult,
  RequestContext,
  Order,
  Payment,
  Logger,
} from '@vendure/core';
import { EASYPAY_METHOD_CODE } from '../constants';

export const easypayPaymentMethodHandler = new PaymentMethodHandler({
  code: EASYPAY_METHOD_CODE,
  description: [
    { languageCode: LanguageCode.en, value: 'Easypay Payment Method' },
    { languageCode: LanguageCode.pt, value: 'Método de Pagamento Easypay' },
  ],
  args: {},

  createPayment: async (
    ctx: RequestContext,
    order: Order,
    amount: number,
    args,
    metadata,
  ): Promise<CreatePaymentResult> => {
    const md: any = metadata || {};
    const transactionId = md.transactionId || md.id || order.code;

    // Secure state default (webhook already normalizes md.state)
    let state: 'Authorized' | 'Settled' = md.state === 'Settled' ? 'Settled' : 'Authorized';
    if (md.state !== 'Authorized' && md.state !== 'Settled') {
      Logger.info(`[EASYPAY] createPayment: estado inesperado '${md.state}', a usar '${state}'.`, 'easypay');
    }

    Logger.info(`[EASYPAY] createPayment → tx=${transactionId} state=${state} amount=${amount}`, 'easypay');

    return {
      amount,
      state,
      transactionId,
      metadata: md,
    };
  },

  // Return success=true for Vendure to mark as Settled
  settlePayment: async (ctx: RequestContext, order: Order, payment: Payment) => {
    Logger.info(`[EASYPAY] settlePayment → OK (delegado ao webhook para timing).`, 'easypay');
    // Already captured in EasyPay via SDK
    return { success: true };
  },
});
