import { PaymentMethodHandler, LanguageCode } from '@vendure/core';

export const userCreditPaymentHandler = new PaymentMethodHandler({
  code: 'user-credit-payment-handler',
  description: [
    { languageCode: LanguageCode.en, value: 'User Credit Payment Method' },
    { languageCode: LanguageCode.pt, value: 'Método de Pagamento de Crédito do Usuário' },
  ],
  args: {},
  createPayment: async (ctx, order, amount, args, metadata) => {
    // Validate transaction ID is provided
    const transactionId = metadata?.transactionId;
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      return {
        amount,
        state: 'Declined',
        errorMessage: 'Transaction ID is required for user credit payment.',
        metadata: {},
      };
    }
    const formattedTransactionId = `user-credit-${transactionId.trim()}`;
    return {
      amount,
      state: 'Authorized',
      transactionId: formattedTransactionId,
      metadata: {
        transactionId: formattedTransactionId,
        paymentMethod: 'user-credit',
        createdAt: new Date().toISOString(),
      },
    };
  },
  settlePayment: async (ctx, order, payment, args) => {
    // Admin manually settles the payment
    // This method is called when admin clicks "Settle Payment" in the admin UI
    return {
      success: true,
      metadata: {
        ...payment.metadata,
        settledAt: new Date().toISOString(),
        settledBy: ctx.activeUserId,
      },
    };
  },
});
