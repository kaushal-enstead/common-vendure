import { LanguageCode, PaymentMethodEligibilityChecker } from '@vendure/core';
import { CUSTOM_SHIPPING_QUOTE_STATUS_PENDING } from '../constants';

export const customPaymentEligibilityChecker = new PaymentMethodEligibilityChecker({
  code: 'custom-payment-eligibility-checker',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'Blocks payment while a manual shipping quote is pending',
    },
    {
      languageCode: LanguageCode.pt,
      value: 'Bloqueia pagamento enquanto a cotação de envio manual estiver pendente',
    },
  ],

  args: {},

  check: async (_ctx, order) => {
    const status = String(order.customFields?.customShippingQuoteStatus ?? '');
    return status !== CUSTOM_SHIPPING_QUOTE_STATUS_PENDING;
  },
});
