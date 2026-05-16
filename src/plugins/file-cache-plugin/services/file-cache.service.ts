import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PaginatedList } from '@vendure/common/lib/shared-types';
import { RequestContext } from '@vendure/core';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { FILE_CACHE_PLUGIN_OPTIONS } from '../constants';
import { PluginInitOptions } from '../types';
import {
  CreateFileCacheInput,
  FileCache,
  FileCacheListOptions,
  FileCacheType,
  UpdateFileCacheInput,
} from '../gql/generated';

interface FileCacheData {
  payload: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FileCacheService {
  private readonly cacheDir: string;

  constructor(@Inject(FILE_CACHE_PLUGIN_OPTIONS) private options: PluginInitOptions) {
    this.cacheDir = path.join(process.cwd(), 'static', this.options.folderName);
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(id: string, type: FileCacheType): string {
    const extension = type === FileCacheType.JSON ? '.json' : '.text';
    return path.join(this.cacheDir, `${id}${extension}`);
  }

  async find(ctx: RequestContext, id: string): Promise<FileCache | null> {
    try {
      const textPath = this.getFilePath(id, FileCacheType.TEXT);
      const jsonPath = this.getFilePath(id, FileCacheType.JSON);

      let filePath: string | null = null;
      let type: FileCacheType = FileCacheType.TEXT;

      if (fs.existsSync(textPath)) {
        filePath = textPath;
      } else if (fs.existsSync(jsonPath)) {
        filePath = jsonPath;
        type = FileCacheType.JSON;
      }

      if (!filePath) {
        return null;
      }

      const value = fs.readFileSync(filePath, 'utf-8');
      const parsedValue = await this.parseValue(value, type);
      return {
        id,
        value: parsedValue.payload,
        type,
        createdAt: parsedValue.createdAt,
        updatedAt: parsedValue.updatedAt,
      };
    } catch (e: any) {
      return null;
    }
  }

  async create(ctx: RequestContext, input: CreateFileCacheInput): Promise<FileCache | null> {
    const { id, value, type } = input;
    const textPath = this.getFilePath(id, FileCacheType.TEXT);
    const jsonPath = this.getFilePath(id, FileCacheType.JSON);

    if (fs.existsSync(textPath) || fs.existsSync(jsonPath)) {
      return this.find(ctx, id);
    }

    const filePath = type === FileCacheType.JSON ? jsonPath : textPath;
    const formattedValue = await this.transformValue(value, type);
    fs.writeFileSync(filePath, formattedValue);
    const stats = fs.statSync(filePath);

    return {
      id,
      value,
      type,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  async update(ctx: RequestContext, input: UpdateFileCacheInput): Promise<FileCache> {
    const { id, value } = input;
    const existing = await this.find(ctx, id);
    if (!existing) {
      throw new Error(`No cache entry found with id: ${id}`);
    }

    const filePath = this.getFilePath(id, existing.type);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File with id ${id} does not exist`);
    }

    const formattedValue = await this.transformValue(value, existing.type);
    fs.writeFileSync(filePath, formattedValue);
    const stats = fs.statSync(filePath);

    return {
      id,
      value,
      type: existing.type,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  }

  async delete(ctx: RequestContext, id: string): Promise<DeletionResponse> {
    try {
      const textPath = this.getFilePath(id, FileCacheType.TEXT);
      const jsonPath = this.getFilePath(id, FileCacheType.JSON);

      if (fs.existsSync(textPath)) {
        fs.unlinkSync(textPath);
      }
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
      }

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

  async findAll(ctx: RequestContext, options: FileCacheListOptions = {}): Promise<PaginatedList<FileCache>> {
    const files = fs.readdirSync(this.cacheDir);
    let entries: FileCache[] = [];
    const processedKeys = new Set<string>();

    // Load all entries
    for (const file of files) {
      const id = path.basename(file, path.extname(file));
      // Skip if we've already processed this id
      if (processedKeys.has(id)) {
        continue;
      }
      processedKeys.add(id);
      const entry = await this.find(ctx, id);
      if (entry) {
        entries.push(entry);
      }
    }

    // Apply filters
    if (options.filter) {
      entries = entries.filter(entry => {
        if (options.filter?.id?.eq && entry.id !== options.filter.id.eq) {
          return false;
        }
        if (options.filter?.type?.eq && entry.type !== options.filter.type.eq) {
          return false;
        }
        if (options.filter?.createdAt) {
          if (options.filter.createdAt.before && entry.createdAt > options.filter.createdAt.before) {
            return false;
          }
          if (options.filter.createdAt.after && entry.createdAt < options.filter.createdAt.after) {
            return false;
          }
        }
        if (options.filter?.updatedAt) {
          if (options.filter.updatedAt.before && entry.updatedAt > options.filter.updatedAt.before) {
            return false;
          }
          if (options.filter.updatedAt.after && entry.updatedAt < options.filter.updatedAt.after) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (options.sort) {
      entries.sort((a, b) => {
        if (options.sort?.id) {
          const keyCompare = a.id.localeCompare(b.id);
          if (keyCompare !== 0) {
            return options.sort.id === 'ASC' ? keyCompare : -keyCompare;
          }
        }
        if (options.sort?.createdAt) {
          const dateCompare = a.createdAt.getTime() - b.createdAt.getTime();
          if (dateCompare !== 0) {
            return options.sort.createdAt === 'ASC' ? dateCompare : -dateCompare;
          }
        }
        if (options.sort?.updatedAt) {
          const dateCompare = a.updatedAt.getTime() - b.updatedAt.getTime();
          if (dateCompare !== 0) {
            return options.sort.updatedAt === 'ASC' ? dateCompare : -dateCompare;
          }
        }
        return 0;
      });
    }

    // Apply pagination
    const totalItems = entries.length;
    const skip = options.skip || 0;
    const take = options.take || totalItems;
    entries = entries.slice(skip, skip + take);

    return {
      items: entries,
      totalItems,
    };
  }

  private async transformValue(value: string, type: FileCacheType): Promise<string> {
    const formattedValue: FileCacheData = {
      payload: type === FileCacheType.JSON ? JSON.parse(value) : value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return JSON.stringify(formattedValue, null, 2);
  }

  private async parseValue(value: string, type: FileCacheType): Promise<FileCacheData> {
    const parsedValue = JSON.parse(value) as FileCacheData;
    return {
      payload: type === FileCacheType.JSON ? JSON.stringify(parsedValue.payload) : parsedValue.payload,
      createdAt: parsedValue.createdAt,
      updatedAt: parsedValue.updatedAt,
    };
  }
}
