import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeletionResponse } from '@vendure/common/lib/generated-types';
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
import { SupportTicketPermissions } from '../constants';
import {
  AddSupportTicketMessageInput,
  UpdateSupportTicketInput,
  UpdateSupportTicketStatusInput,
} from '../gql/generated';
import { SupportTicketService } from '../services/support-ticket.service';

@Resolver()
export class SupportTicketResolver {
  constructor(private supportTicketService: SupportTicketService) {}

  @Query()
  @Allow(SupportTicketPermissions.Read)
  async supportTickets(
    @Ctx() ctx: RequestContext,
    @Args() args: { options: ListQueryOptions<SupportTicket> },
    @Relations(SupportTicket) relations: RelationPaths<SupportTicket>,
  ): Promise<PaginatedList<SupportTicket>> {
    return this.supportTicketService.findAll(ctx, args.options, relations);
  }

  @Query()
  @Allow(SupportTicketPermissions.Read)
  async supportTicket(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: string },
    @Relations(SupportTicket) relations: RelationPaths<SupportTicket>,
  ): Promise<SupportTicket | null> {
    return this.supportTicketService.findOne(ctx, args.id, relations);
  }

  @Mutation()
  @Allow(SupportTicketPermissions.Update)
  @Transaction()
  async updateSupportTicket(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateSupportTicketInput },
  ): Promise<SupportTicket> {
    return this.supportTicketService.update(ctx, args.input);
  }

  @Mutation()
  @Allow(SupportTicketPermissions.Delete)
  @Transaction()
  async deleteSupportTicket(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: string },
  ): Promise<DeletionResponse> {
    return await this.supportTicketService.delete(ctx, args.id);
  }

  @Mutation()
  @Allow(SupportTicketPermissions.Delete)
  @Transaction()
  async deleteSupportTickets(
    @Ctx() ctx: RequestContext,
    @Args() args: { ids: string[] },
  ): Promise<DeletionResponse[]> {
    return await Promise.all(args.ids.map(id => this.supportTicketService.delete(ctx, id)));
  }

  @Mutation()
  @Allow(SupportTicketPermissions.Update)
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

  @Mutation()
  @Allow(SupportTicketPermissions.Update)
  @Transaction()
  async updateSupportTicketStatus(
    @Ctx() ctx: RequestContext,
    @Args() args: { input: UpdateSupportTicketStatusInput },
  ): Promise<SupportTicket> {
    return this.supportTicketService.updateStatus(ctx, args.input);
  }
}
