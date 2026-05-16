import { EmailEventListener } from '@vendure/email-plugin';
import { LanguageCode, RequestContext } from '@vendure/core';
import { CustomShippingQuoteReadyEvent } from './event-types';

/**
 * Sends a transactional email to the customer when the admin sets a
 * shipping quote for their out-of-Europe order.
 *
 * Template vars available in the email template:
 *   - orderCode
 *   - shippingAmountWithTax  (formatted as "19.90")
 *   - currencyCode           (e.g. "EUR")
 */
export const customShippingQuoteReadyHandler = new EmailEventListener('custom-shipping-quote-ready')
    .on(CustomShippingQuoteReadyEvent)
    .setRecipient(event => event.email)
    .setSubject(event => {
        if (event.ctx.languageCode === LanguageCode.pt) {
            return `O valor de envio da encomenda ${event.orderCode} está pronto`;
        }
        return `Shipping quote ready for order ${event.orderCode}`;
    })
    .setTemplateVars(event => ({
        orderCode: event.orderCode,
        shippingAmountWithTax: (event.shippingAmountWithTax / 100).toFixed(2),
        currencyCode: event.currencyCode,
    }))
    .setFrom('{{ fromAddress }}')
    .setMockEvent(
        new CustomShippingQuoteReadyEvent(
            RequestContext.empty(),
            'customer@example.com',
            'ORDER-001',
            1990,
            'EUR',
        ),
    );
