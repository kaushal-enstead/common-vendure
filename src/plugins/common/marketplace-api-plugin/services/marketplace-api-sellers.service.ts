import { Injectable } from '@nestjs/common';
import { Seller, TransactionalConnection } from '@vendure/core';
import { IsNull } from 'typeorm';

@Injectable()
export class MarketplaceApiSellersService {
    constructor(private connection: TransactionalConnection) {}

    async findAll(options: { take: number; skip: number }) {
        const [items, totalItems] = await this.connection
            .getRepository(Seller)
            .findAndCount({
                where: { deletedAt: IsNull() },
                take: options.take,
                skip: options.skip,
            });
        return { items, totalItems, take: options.take, skip: options.skip };
    }
}
