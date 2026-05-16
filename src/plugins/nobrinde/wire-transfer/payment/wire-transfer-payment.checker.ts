import { LanguageCode, PaymentMethodEligibilityChecker } from '@vendure/core';

export const wireTransferPaymentChecker = new PaymentMethodEligibilityChecker({
  code: 'wire-transfer-checker',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'Wire Transfer Checker - Validates minimum order value',
    },
    {
      languageCode: LanguageCode.pt,
      value: 'Verificador de Transferência Bancária - Valida o valor mínimo do pedido',
    },
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
          value: 'O valor mínimo do pedido necessário para usar este método de pagamento',
        },
      ],
      required: true,
      config: { inputType: 'money' },
    },
  },
  check: async (ctx, order, args) => {
    // Check if order total meets minimum value requirement
    return order.totalWithTax >= args.minOrderValue;

    // if (order.totalWithTax < args.minOrderValue) {
    //   return `Order total must be at least ${args.minOrderValue / 100} to use wire transfer.`;
    // }

    // return true;
  },
});
