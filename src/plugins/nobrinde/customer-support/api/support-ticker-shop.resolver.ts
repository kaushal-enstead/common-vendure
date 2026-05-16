import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import {
  Allow,
  Ctx,
  ListQueryOptions,
  RelationPaths,
  Relations,
  RequestContext,
  Transaction,
  UserInputError,
} from '@vendure/core';

import { SupportTicket } from '../entities/support-ticket.entity';
import { Permission } from '@vendure/common/lib/generated-types';
import { AddSupportTicketMessageInput, CreateSupportTicketInput } from '../gql/generated';
import { SupportTicketService } from '../services/support-ticket.service';

@Resolver()
export class SupportTicketShopResolver {
  constructor(private supportTicketService: SupportTicketService) {}

  @Query()
  @Allow(Permission.Authenticated)
  async mySupportTickets(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<SupportTicket> },
    @Relations(SupportTicket) relations: RelationPaths<SupportTicket>,
  ): Promise<PaginatedList<SupportTicket>> {
    if (!ctx.activeUserId) {
      throw new UserInputError('User must be authenticated');
    }
    return this.supportTicketService.findByCustomer(ctx, args.options, relations);
  }

  @Mutation()
  @Allow(Permission.Authenticated)
  @Transaction()
  async createSupportTicket(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: CreateSupportTicketInput },
  ): Promise<SupportTicket> {
    if (!ctx.activeUserId) {
      throw new UserInputError('User must be authenticated');
    }
    return this.supportTicketService.create(ctx, args.input);
  }

  @Mutation()
  @Allow(Permission.Authenticated)
  @Transaction()
  async addSupportTicketMessage(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: AddSupportTicketMessageInput },
  ): Promise<SupportTicket> {
    if (!ctx.activeUserId) {
      throw new UserInputError('User must be authenticated');
    }
    return this.supportTicketService.addMessage(ctx, args.input);
  }
}
