import { PaymentMethodHandler, LanguageCode } from '@vendure/core';

export const wireTransferPaymentHandler = new PaymentMethodHandler({
  code: 'wire-transfer-handler',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'Wire Transfer - Bank transfer payment method',
    },
    {
      languageCode: LanguageCode.pt,
      value: 'Transferência Bancária - Método de pagamento por transferência bancária',
    },
  ],
  args: {
    automaticSettle: {
      type: 'boolean',
      label: [
        { languageCode: LanguageCode.en, value: 'Authorize and settle in 1 step' },
        { languageCode: LanguageCode.pt, value: 'Autorizar e liquidar em 1 passo' },
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'If enabled, Payments will be created in the "Settled" state.',
        },
        {
          languageCode: LanguageCode.pt,
          value: 'Se habilitado, os pagamentos serão criados no estado "Settled".',
        },
      ],
      required: true,
      defaultValue: false,
    },
  },
  createPayment: async (ctx, order, amount, args, metadata) => {
    // Validate transaction ID is provided
    const transactionId = metadata?.transactionId;
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      return {
        amount,
        state: 'Declined',
        errorMessage: 'Transaction ID is required for wire transfer payment.',
        metadata: {},
      };
    }
    return {
      amount,
      state: args.automaticSettle ? 'Settled' : 'Authorized',
      transactionId: transactionId.trim(),
      metadata: {
        transactionId: transactionId.trim(),
        paymentMethod: 'wire-transfer',
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
