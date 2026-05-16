import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
  assertFound,
  ChannelService,
  Customer,
  ListQueryBuilder,
  ListQueryOptions,
  patchEntity,
  RelationPaths,
  RequestContext,
  TransactionalConnection,
  TranslatorService,
} from '@vendure/core';
import { IsNull } from 'typeorm';
import { CUSTOMER_SUPPORT_PLUGIN_OPTIONS } from '../constants';
import { SupportTicket } from '../entities/support-ticket.entity';
import {
  AddSupportTicketMessageInput,
  CreateSupportTicketInput,
  SupportTicketPriority,
  SupportTicketSender,
  SupportTicketStatus,
  UpdateSupportTicketInput,
  UpdateSupportTicketStatusInput,
} from '../gql/generated';
import { PluginInitOptions } from '../types';

@Injectable()
export class SupportTicketService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private channelService: ChannelService,
    private translator: TranslatorService,
    @Inject(CUSTOMER_SUPPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  private translateEntity(item: SupportTicket, ctx: RequestContext) {
    item.subject = this.translator.translate(item.subject, ctx);
    return item;
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<SupportTicket>,
    relations?: RelationPaths<SupportTicket>,
  ): Promise<PaginatedList<SupportTicket>> {
    return this.listQueryBuilder
      .build(SupportTicket, options, {
        relations,
        ctx,
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items: items.map(item => this.translateEntity(item, ctx)),
          totalItems,
        };
      });
  }

  findOne(
    ctx: RequestContext,
    id: ID,
    relations?: RelationPaths<SupportTicket>,
  ): Promise<SupportTicket | null> {
    return this.connection
      .getRepository(ctx, SupportTicket)
      .findOne({
        where: { id },
        relations,
      })
      .then(entity => entity && this.translateEntity(entity, ctx));
  }

  async create(ctx: RequestContext, input: CreateSupportTicketInput): Promise<SupportTicket> {
    const customer = await this.connection.getRepository(ctx, Customer).findOne({
      where: { deletedAt: IsNull(), user: { id: ctx.activeUserId } },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const ticket = new SupportTicket({
      ...input,
      customerId: String(customer.id),
      status: SupportTicketStatus.OPEN,
      priority: input.priority || SupportTicketPriority.LOW,
      messages: [],
    });

    const newEntity = await this.connection.getRepository(ctx, SupportTicket).save(ticket);
    return assertFound(this.findOne(ctx, newEntity.id));
  }

  async update(ctx: RequestContext, input: UpdateSupportTicketInput): Promise<SupportTicket> {
    const entity = await this.connection.getEntityOrThrow(ctx, SupportTicket, input.id);
    const updatedEntity = patchEntity(entity, input);
    await this.connection.getRepository(ctx, SupportTicket).save(updatedEntity, { reload: false });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, SupportTicket, id);
    try {
      await this.connection.getRepository(ctx, SupportTicket).remove(entity);
      return {
        result: DeletionResult.DELETED,
      };
    } catch (e: any) {
      return {
        result: DeletionResult.NOT_DELETED,
        message: e.toString(),
      };
    }
  }

  async findByCustomer(
    ctx: RequestContext,
    options?: ListQueryOptions<SupportTicket>,
    relations?: RelationPaths<SupportTicket>,
  ): Promise<PaginatedList<SupportTicket>> {
    const customer = await this.connection.getRepository(ctx, Customer).findOne({
      where: { deletedAt: IsNull(), user: { id: ctx.activeUserId } },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.listQueryBuilder
      .build(SupportTicket, options, {
        relations,
        ctx,
        where: { customerId: String(customer.id) },
      })
      .getManyAndCount()
      .then(([items, totalItems]) => {
        return {
          items,
          totalItems,
        };
      });
  }

  async addMessage(ctx: RequestContext, input: AddSupportTicketMessageInput): Promise<SupportTicket> {
    const ticket = await this.connection.getEntityOrThrow(ctx, SupportTicket, input.supportTicketId);

    const newMessage = {
      id: `msg-${Date.now()}`,
      content: input.content,
      sender: ctx.apiType === 'shop' ? SupportTicketSender.CUSTOMER : SupportTicketSender.SELLER,
      senderId: ctx.activeUserId as string,
      timestamp: new Date(),
      ticketId: input.supportTicketId,
    };

    const messages = ticket?.messages || [];
    messages.push(newMessage);
    ticket.messages = messages;

    await this.connection.getRepository(ctx, SupportTicket).save(ticket);
    return assertFound(this.findOne(ctx, ticket.id));
  }

  async updateStatus(ctx: RequestContext, input: UpdateSupportTicketStatusInput): Promise<SupportTicket> {
    const ticket = await this.connection.getEntityOrThrow(ctx, SupportTicket, input.supportTicketId);
    ticket.status = input.status;
    await this.connection.getRepository(ctx, SupportTicket).save(ticket);
    return assertFound(this.findOne(ctx, ticket.id));
  }
}
