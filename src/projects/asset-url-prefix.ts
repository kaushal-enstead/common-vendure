import type { RequestContext } from '@vendure/core';

export function assetUrlPrefix(_ctx: RequestContext, identifier: string): string {
  if (identifier.startsWith('http')) return '';
  return process.env.API_HOST ? `${process.env.API_HOST}/assets/` : '';
}
