import { Inject, Injectable } from '@nestjs/common';
import { Order, OrderService, RequestContext, TransactionalConnection, Logger } from '@vendure/core';
import { EASYPAY_PLUGIN_OPTIONS } from '../constants';
import { EasypayConnectSdk } from '../payment/easypay-connect-sdk';
import { PluginInitOptions } from '../types';
import * as crypto from 'crypto';

@Injectable()
export class EasypaySdkService {
  private sdk: EasypayConnectSdk;

  constructor(
    @Inject(EASYPAY_PLUGIN_OPTIONS) private options: PluginInitOptions,
    private orderService: OrderService,
    private connection: TransactionalConnection,
  ) {
    this.sdk = new EasypayConnectSdk({
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      accountId: options.accountId,
    });
  }

  /**
   * Creates a checkout:
   * - if the shipping method code starts with "courier" → authorisation (hold funds until delivery)
   * - otherwise          → sale         (capture seller + platform immediately)
   */
  async createCheckoutForOrder(
    ctx: RequestContext,
    order: Order,
    amount: number,
    metadata: { capture: { descriptive?: string; transaction_key?: string; splits?: any[] } },
  ): Promise<{ transactionId: string; state: string; metadata: any }> {
    // 0) Do not assume shippingLines[0] nor decide here courier vs non-courier
    // The "caller" (resolver) is who decides WHAT splits to send (if any)
    const shippingLines = (order as any).shippingLines ?? [];
    Logger.info(
      `🔍 [EasyPaySdkService] shippingLines=${shippingLines.length} (decisão de splits feita no caller)`,
      'easypay',
    );

    // 1) Base fields
    const descriptive = metadata.capture.descriptive ?? `Order ${order.code}`;
    const transactionKey = metadata.capture.transaction_key ?? order.code;

    // 2) Payment type: ALWAYS authorization (initial hold)
    const paymentType = 'authorisation';
    Logger.info(`🔄 [EasyPaySdkService] Using payment.type="${paymentType}"`, 'easypay');

    // 3) Splits to send: exactly those that come from the caller
    const splitsToSend = Array.isArray(metadata.capture.splits) ? metadata.capture.splits : [];
    Logger.info(
      `🔍 [EasyPaySdkService] Splits to send (${splitsToSend.length}): ${JSON.stringify(
        splitsToSend.map(s => s.split_key),
      )}`,
      'easypay',
    );

    // 4) Payment block
    const paymentBlock: any = {
      methods: ['cc', 'mb', 'dd'],
      type: paymentType as 'sale' | 'authorisation',
      currency: 'EUR',
      key: order.code,
      capture: {
        descriptive,
        transaction_key: transactionKey,
        splits: splitsToSend,
      },
    };

    // 5) Complete payload
    const payload = {
      type: ['single'],
      payment: paymentBlock,
      order: {
        key: order.code,
        value: amount / 100,
        items: order.lines.map(line => ({
          description: line.productVariant.name,
          quantity: line.quantity,
          key: line.id.toString(),
          value: line.unitPriceWithTax / 100,
        })),
      },
      customer: {
        name: `${order.customer?.firstName ?? 'Sem'} ${order.customer?.lastName ?? 'Nome'}`.trim(),
        email: order.customer?.emailAddress ?? 'sem-email@example.com',
        phone: (order.shippingAddress?.phoneNumber ?? '911234567').replace(/\D/g, '').slice(-9),
        phone_indicative: '+351',
        fiscal_number: (order.customer?.customFields as any)?.vatNumber?.trim() || '000000000',
        key: `customer-${order.customer?.id ?? order.code}`,
        language: 'PT',
      },
      success_url: process.env.EASYPAY_SUCCESS_URL!,
      cancel_url: process.env.EASYPAY_CANCEL_URL!,
    };

    Logger.info(
      `📤 [EasyPaySdkService] Sending checkout payload:\n${JSON.stringify(payload, null, 2)}`,
      'easypay',
    );
    const result = await this.sdk.createCheckout(payload, order.code);
    Logger.info(
      `🔑 [EasyPaySdkService] Received checkout result:\n${JSON.stringify(result, null, 2)}`,
      'easypay',
    );

    // 6) Save session/URLs
    await this.orderService.updateCustomFields(ctx, order.id, {
      easypayCheckoutUrl: result.checkout_url,
      easypayCheckoutId: result.checkout_id,
      easypaySession: result.session,
      easypayConfig: result.config,
    });

    // 7) Immediate capture ONLY if the caller sent splits (all-non-courier or the non-courier part in a mixed scenario)
    //if (splitsToSend.length > 0) {
    //Logger.info(`[Easypay] Capturing payment immediately after authorisation...`, 'easypay');

    //const captureResult = await this.captureAuthorisationWithSplits(transactionKey, splitsToSend);
    //Logger.info(`[Easypay] Capture result:\n${JSON.stringify(captureResult, null, 2)}`, 'easypay');
    //}

    // 8) Return goal
    return {
      transactionId: result.checkout_id,
      state: 'Authorized',
      metadata: {
        checkoutId: result.checkout_id,
        redirectUrl: result.checkout_url,
        session: result.session,
        config: result.config,
        id: result.id,
      },
    };
  }

  async cancelCheckout(ctx: RequestContext, checkoutId: string): Promise<boolean> {
    Logger.info(`🛑 [EasyPaySdkService] Cancelling checkout ${checkoutId}`, 'easypay');
    const response = await fetch(`${this.options.apiUrl}/checkout/${checkoutId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        AccountId: this.options.accountId,
        ApiKey: this.options.apiKey,
      },
    });
    Logger.info(`🛑 [EasyPaySdkService] Cancel response OK? ${response.ok}`, 'easypay');
    return response.ok;
  }

  async createRefund(ctx: RequestContext, paymentId: string): Promise<any> {
    Logger.info(`↩️ [EasyPaySdkService] Creating refund for payment ${paymentId}`, 'easypay');
    const response = await fetch(`${this.options.apiUrl}/refund/${paymentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccountId: this.options.accountId,
        ApiKey: this.options.apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`EasyPay /refund/${paymentId} error ${response.status}`);
    }
    const json = await response.json();
    Logger.info(`↩️ [EasyPaySdkService] Refund result:\n${JSON.stringify(json, null, 2)}`, 'easypay');
    return json;
  }

  async getTransaction(transactionId: string, type: 'authorisation' | 'capture' | 'sale'): Promise<any> {
    if (!transactionId || !type) {
      Logger.info(`[EasyPaySdkService] Missing transaction type or id`, 'easypay');
      return null;
    }

    if (type === 'authorisation') {
      Logger.info(`[EasyPaySdkService] Skipping fetch: no endpoint for type=authorisation`, 'easypay');
      return null; // use the body directly
    }

    const base = this.options.apiUrl.replace(/\/+$/, '');
    const url = `${base}/${type}/${transactionId}`;

    Logger.info(`[EasyPaySdkService] Fetching Easypay ${type} ${transactionId} from ${url}`, 'easypay');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        AccountId: this.options.accountId,
        ApiKey: this.options.apiKey,
      },
    });

    if (!response.ok) {
      Logger.error(`[EasyPaySdkService] Easypay GET ${url} failed with status ${response.status}`, 'easypay');
      return null;
    }

    return response.json();
  }

  /**
   * Adds the total value of the splits to the order.value field
   */
  private computeSplitTotal(splits: Array<{ value: number }>): number {
    return splits.reduce((sum, split) => sum + (split.value ?? 0), 0);
  }

  /**
   * Verifies HMAC-SHA256 signature of webhook payload
   */
  verifySignature(payload: any, signature: string): boolean {
    const bodyString = JSON.stringify(payload);
    const computed = crypto.createHmac('sha256', this.options.apiKey).update(bodyString).digest('hex');
    const valid = computed === signature;
    Logger.info(`Signature valid? ${valid}`, 'easypay');
    return valid;
  }

  /**
   * Captures prior authorization, sending splits to EasyPay
   * @param transactionKey The same key/Idempotency-Key used in the original authorization
   * @param splits Array of splits { split_key, split_descriptive, value, account: { id } }
   */
  async captureAuthorisationWithSplits(
    paymentId: string,
    transactionKey: string,
    splits: Array<{
      split_key: string;
      split_descriptive: string;
      value: number;
      account: { id: string };
    }>,
  ): Promise<any> {
    Logger.info(
      `[EasypaySdkService] Capturing paymentId=${paymentId} txKey=${transactionKey} with splits: ${JSON.stringify(splits)}`,
      'easypay',
    );

    if (!Array.isArray(splits) || splits.length === 0) {
      throw new Error('[EasypaySdkService] No splits provided to captureAuthorisationWithSplits');
    }

    // sum in euros, guaranteeing 2 houses
    const total = Number(splits.reduce((acc, s) => acc + Number(s.value || 0), 0).toFixed(2));
    if (!total || total < 0.5) {
      throw new Error(`[EasypaySdkService] Invalid total split value (${total}). Must be >= 0.50 EUR`);
    }

    const payload = {
      transaction_key: transactionKey,
      descriptive: `Capture ${transactionKey}`,
      value: total,
      splits: splits.map(s => ({
        split_key: s.split_key,
        split_descriptive: s.split_descriptive,
        value: Number(s.value.toFixed(2)),
        account: { id: s.account.id },
      })),
    };

    const result = await this.sdk.capture(paymentId, payload, transactionKey);
    Logger.info(
      `[EasypaySdkService] captureAuthorisationWithSplits result:\n${JSON.stringify(result, null, 2)}`,
      'easypay',
    );
    return result;
  }
}
