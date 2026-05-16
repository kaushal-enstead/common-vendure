import { Logger, PaymentMethodEligibilityChecker, LanguageCode } from '@vendure/core';

export const userCreditPaymentChecker = new PaymentMethodEligibilityChecker({
  code: 'user-credit-payment-checker',
  description: [
    { languageCode: LanguageCode.en, value: 'User Credit Payment Method Checker' },
    { languageCode: LanguageCode.pt, value: 'Verificador de Método de Pagamento de Crédito do Usuário' },
  ],
  args: {
    minOrderValue: {
      type: 'int',
      label: [
        { languageCode: LanguageCode.en, value: 'Minimum Order Value' },
        { languageCode: LanguageCode.pt, value: 'Valor Mínimo do Pedido' },
      ],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'The minimum order value required to use this payment method',
        },
        {
          languageCode: LanguageCode.pt,
          value: 'O valor mínimo do pedido requerido para usar este método de pagamento',
        },
      ],
      config: { inputType: 'money' },
      defaultValue: 0,
    },
  },
  check: async (ctx, order, args) => {
    try {
      // Get customer
      const customer = order.customer;
      if (!customer) {
        return false;
      }

      // Get customer custom fields
      const credits = customer.customFields?.credits || 0;
      const creditsUsed = customer.customFields?.credits_used || 0;
      const availableCredits = credits - creditsUsed;

      // Check minimum order value
      const minOrderValue = args.minOrderValue || 0;
      if (order.totalWithTax < minOrderValue) {
        return false;
      }

      // Check if customer has sufficient credits
      if (availableCredits < order.totalWithTax / 100) {
        return false;
      }

      // Payment method is available
      return true;
    } catch (error) {
      Logger.error(`Error in userCreditPaymentChecker.check: ${error}`, 'UserCreditPlugin');
      return false;
    }
  },
});
