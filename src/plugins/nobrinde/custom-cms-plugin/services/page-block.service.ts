import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID } from '@vendure/common/lib/shared-types';
import {
  RequestContext,
  TransactionalConnection,
  assertFound,
  TranslatableSaver,
  Translated,
  TranslatorService,
  ChannelService,
} from '@vendure/core';
import { CMS_PLUGIN_OPTIONS } from '../constants';
import { PageBlock } from '../entities/page-builder/page-block.entity';
import { PageBlockTranslation } from '../entities/page-builder/page-block-translation.entity';
import { PluginInitOptions } from '../types';
import { CreatePageBlockInput, UpdatePageBlockInput } from '../gql/generated';
import { In } from 'typeorm';

@Injectable()
export class PageBlockService {
  constructor(
    private connection: TransactionalConnection,
    private translatableSaver: TranslatableSaver,
    private translator: TranslatorService,
    @Inject(CMS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    private channelService: ChannelService,
  ) {}

  async findByIds(ctx: RequestContext, ids: ID[]): Promise<Array<Translated<PageBlock>>> {
    return this.connection
      .getRepository(ctx, PageBlock)
      .find({
        where: { id: In(ids) },
        order: { index: 'ASC' },
        relations: ['page', 'translations'],
      })
      .then(entities => entities.map(entity => this.translator.translate(entity, ctx)));
  }

  async findOne(ctx: RequestContext, id: ID): Promise<Translated<PageBlock> | null> {
    return this.connection
      .getRepository(ctx, PageBlock)
      .findOne({
        where: { id },
        relations: ['page', 'translations'],
      })
      .then(entity => {
        if (entity) {
          return this.translator.translate(entity, ctx);
        }
        return null;
      });
  }

  async findByPageId(ctx: RequestContext, pageId: ID): Promise<Translated<PageBlock>[]> {
    return this.connection
      .getRepository(ctx, PageBlock)
      .find({
        where: { pageId: pageId as string },
        relations: ['translations'],
        order: { index: 'ASC' },
      })
      .then(entities => entities.map(entity => this.translator.translate(entity, ctx)));
  }

  async create(ctx: RequestContext, input: CreatePageBlockInput): Promise<Translated<PageBlock>> {
    const blockRepo = this.connection.getRepository(ctx, PageBlock);

    // Get the max index for this page to set the new block's index
    const existingBlocks = await blockRepo.find({
      where: { pageId: input.pageId },
      order: { index: 'DESC' },
      take: 1,
    });

    const maxIndex = existingBlocks.length > 0 ? existingBlocks[0].index : -1;
    const newIndex = maxIndex + 1;

    // Ensure we pass the patched translations to the input for creation
    const fullInput = {
      ...input,
      index: newIndex,
    };

    // Use TranslatableSaver to handle translations
    const newBlock = await this.translatableSaver.create({
      ctx,
      input: fullInput,
      entityType: PageBlock,
      translationType: PageBlockTranslation,
    });

    return assertFound(this.findOne(ctx, newBlock.id));
  }

  async update(ctx: RequestContext, input: UpdatePageBlockInput): Promise<Translated<PageBlock>> {
    const blockData = await this.findOne(ctx, input.id);
    if (!blockData?.columns?.length) {
      //  new columns are created first time
      const channel = await this.channelService.getChannelFromToken(ctx, ctx.channel.token);
      const { availableLanguageCodes } = channel;

      const baseTranslation =
        input.translations && input.translations.length > 0 ? input.translations[0] : null;

      // Build translations for all available languages
      input.translations =
        baseTranslation && Array.isArray(availableLanguageCodes) && availableLanguageCodes.length > 0
          ? availableLanguageCodes.map((lang: any) => ({
              ...baseTranslation,
              languageCode: lang,
              id: undefined, // avoid setting id, let ORM assign
            }))
          : input.translations;
    }

    const updatedEntity = await this.translatableSaver.update({
      ctx,
      input,
      entityType: PageBlock,
      translationType: PageBlockTranslation,
    });
    return assertFound(this.findOne(ctx, updatedEntity.id));
  }

  async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
    const entity = await this.connection.getEntityOrThrow(ctx, PageBlock, id);
    try {
      await this.connection.getRepository(ctx, PageBlock).remove(entity);
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

  async reorder(ctx: RequestContext, blockIds: ID[]): Promise<Translated<PageBlock>[]> {
    const blockRepo = this.connection.getRepository(ctx, PageBlock);
    const blocks = await blockRepo.find({
      where: { id: In(blockIds) },
    });

    // Update indices based on the new order
    for (let i = 0; i < blockIds.length; i++) {
      const block = blocks.find(b => b.id === blockIds[i]);
      if (block) {
        block.index = i;
        await blockRepo.save(block);
      }
    }
    return this.findByIds(ctx, blockIds);
  }

  async duplicate(ctx: RequestContext, id: ID): Promise<Translated<PageBlock>> {
    // Fetch the original PageBlock including translations
    const originalBlock = await this.connection.getEntityOrThrow(ctx, PageBlock, id, {
      relations: ['translations'],
    });

    // Find the current highest index for this page
    const blockRepo = this.connection.getRepository(ctx, PageBlock);
    const existingBlocks = await blockRepo.find({
      where: { pageId: originalBlock.pageId },
      order: { index: 'DESC' },
      take: 1,
    });
    const maxIndex = existingBlocks.length > 0 ? existingBlocks[0].index : -1;

    // Shallow-copy translations for the duplicate (removing their IDs)
    const translations = (originalBlock.translations || []).map(t => ({
      ...t,
      id: undefined,
    }));

    // Prepare the duplicate block's input
    const duplicateInput: CreatePageBlockInput = {
      pageId: originalBlock.pageId,
      code: originalBlock.code ? `${originalBlock.code} (duplicate)` : null,
      index: maxIndex + 1,
      active: originalBlock.active,
      css: originalBlock.css ? JSON.parse(JSON.stringify(originalBlock.css)) : null,
      translations: translations as any,
    };

    // Create and return the duplicated PageBlock
    const duplicatedBlock = await this.translatableSaver.create({
      ctx,
      input: duplicateInput,
      entityType: PageBlock,
      translationType: PageBlockTranslation,
    });
    return assertFound(this.findOne(ctx, duplicatedBlock.id));
  }
}
