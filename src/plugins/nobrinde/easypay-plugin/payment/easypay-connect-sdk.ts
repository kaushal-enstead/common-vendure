import fetch from 'node-fetch';
import { Logger } from '@vendure/core';

export class EasypayConnectSdk {
  constructor(
    private options: {
      apiUrl: string;
      apiKey: string;
      accountId: string;
      idempotencyKeyGenerator?: () => string;
    },
  ) {}

  async capture(paymentId: string, payload: any, idempotencyKey?: string): Promise<any> {
    const key = idempotencyKey || this.generateIdempotencyKey();
    const url = `${this.options.apiUrl}/capture/${paymentId}`;

    Logger.info(`➡️ [EASYPAY] Sending capture request to: ${url}`, 'easypay-sdk');
    Logger.info(`➡️ [EASYPAY] Headers: ${JSON.stringify(this.getHeaders('POST', key))}`, 'easypay-sdk');
    Logger.info(`➡️ [EASYPAY] Payload:\n${JSON.stringify(payload, null, 2)}`, 'easypay-sdk');

    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('POST', key),
      body: JSON.stringify(payload),
    });

    const bodyText = await resp.text();
    if (!resp.ok) {
      Logger.info(`❌ [EASYPAY] Capture error ${resp.status}: ${bodyText}`, 'easypay-sdk');
      throw new Error(`Easypay /capture error ${resp.status} - ${bodyText}`);
    }
    return JSON.parse(bodyText);
  }

  async createSinglePayment(payload: any, idempotencyKey?: string): Promise<any> {
    const key = idempotencyKey || this.generateIdempotencyKey();
    const url = `${this.options.apiUrl}/single`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('POST', key),
      body: JSON.stringify(payload),
    });

    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`Easypay /single error ${resp.status} - ${bodyText}`);

    return JSON.parse(bodyText);
  }

  async createCheckout(payload: any, idempotencyKey?: string): Promise<any> {
    const key = idempotencyKey || this.generateIdempotencyKey();
    const url = `${this.options.apiUrl}/checkout`;

    Logger.info(`➡️ [EASYPAY] Sending checkout request to: ${url}`, 'easypay-sdk');
    Logger.info(`➡️ [EASYPAY] Headers: ${JSON.stringify(this.getHeaders('POST', key))}`, 'easypay-sdk');
    Logger.info(`➡️ [EASYPAY] Payload:\n${JSON.stringify(payload, null, 2)}`, 'easypay-sdk');

    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('POST', key),
      body: JSON.stringify(payload),
    });

    const bodyText = await resp.text();

    if (!resp.ok) {
      Logger.info(`❌ [EASYPAY] Error ${resp.status}: ${bodyText}`, 'easypay-sdk');
      throw new Error(`Easypay /checkout error ${resp.status} - ${bodyText}`);
    }

    return JSON.parse(bodyText);
  }

  async cancelCheckout(checkoutId: string): Promise<boolean> {
    const url = `${this.options.apiUrl}/checkout/${checkoutId}`;
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders('DELETE'),
    });
    return resp.ok;
  }

  async getOutPayment(paymentId: string): Promise<any> {
    const url = `${this.options.apiUrl}/out_payment/${paymentId}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders('GET'),
    });

    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`Easypay /out_payment error ${resp.status} - ${bodyText}`);

    return JSON.parse(bodyText);
  }

  async createRefund(paymentId: string, idempotencyKey?: string): Promise<any> {
    const key = idempotencyKey || this.generateIdempotencyKey();
    const url = `${this.options.apiUrl}/refund/${paymentId}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders('POST', key),
    });

    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`Easypay /refund error ${resp.status} - ${bodyText}`);

    return JSON.parse(bodyText);
  }

  private getHeaders(method: string, idempotencyKey?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      AccountId: this.options.accountId,
      ApiKey: this.options.apiKey,
    };

    // Add Idempotency-Key for POST/PATCH requests if needed
    //if ((method === 'POST' || method === 'PATCH') && idempotencyKey) {
    //headers['Idempotency-Key'] = idempotencyKey;
    //}

    return headers;
  }

  /**
   * Generate a unique idempotency key
   * Uses the provided generator function or creates a UUID-based key
   */
  private generateIdempotencyKey(): string {
    if (this.options.idempotencyKeyGenerator) {
      return this.options.idempotencyKeyGenerator();
    }

    // Fallback to timestamp + random string if no generator provided
    return `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
