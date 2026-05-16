import { Injectable } from '@nestjs/common';
import {
  Channel,
  EntityHydrator,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';

export interface ChannelPersonalizationData {
  channelCode: string;
  storeDisplayName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  privacyPolicyUrl: string | null;
  storeAddress: string | null;
  emailHeaderText: string | null;
  emailFooterText: string | null;
  supportEmail: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  billingEmail: string | null;
  channelDomain: string | null;
  certificateProvider: string | null;
  certificateRef: string | null;
  certificateStatus: string | null;
  tlsEnforced: boolean;
}

@Injectable()
export class ChannelPersonalizationService {
  // RelationPaths<Channel> typings are stricter than the runtime paths we want to hydrate here.
  // These are still valid Vendure Channel relations.
  private readonly defaultChannelRelations: RelationPaths<Channel>[] = [
    'defaultTaxZone',
    'defaultShippingZone',
  ] as unknown as RelationPaths<Channel>[];

  constructor(
    private connection: TransactionalConnection,
    private entityHydrator: EntityHydrator,
  ) {}

  async getChannelByDomain(
    ctx: RequestContext,
    domain: string,
    relations?: RelationPaths<Channel>,
  ): Promise<Channel | null> {
    const normalizedDomain = this.normalizeDomain(domain);

    if (!normalizedDomain) {
      return null;
    }

    const channel = await this.connection
      .getRepository(ctx, Channel)
      .createQueryBuilder('channel')
      // .where('LOWER(channel.customFieldsChannelDomain) = LOWER(:domain)', {
      //   domain: normalizedDomain,
      // })
      .where({
        customFields: {
          channelDomain: normalizedDomain,
        },
      })
      .getOne();

    if (!channel) {
      return null;
    }

    // // Ensure these are hydrated because they're Asset relations inside custom fields.
    // const hydrateRelations = unique([
    //   ...(relations ?? this.defaultChannelRelations),
    //   // 'customFields.logo' as any,
    //   // 'customFields.favicon' as any,
    // ]);

    await this.entityHydrator.hydrate(ctx, channel, {
      relations: relations ?? [],
    });

    return channel;
  }

  private normalizeDomain(domain: string): string | null {
    const input = domain?.trim();
    if (!input) {
      return null;
    }

    const withoutProtocol = input.replace(/^https?:\/\//i, '');
    const withoutPath = withoutProtocol.split('/')[0]?.trim().toLowerCase();
    if (!withoutPath) {
      return null;
    }

    return withoutPath.replace(/^www\./, '');
  }
}
