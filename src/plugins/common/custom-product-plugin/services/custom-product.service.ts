import { Injectable } from '@nestjs/common';
import { unique } from '@vendure/common/lib/unique';
import {
  Channel,
  ID,
  ListQueryBuilder,
  ListQueryOptions,
  PaginatedList,
  Product,
  ProductVariant,
  RelationPaths,
  RequestContext,
  Seller,
  TransactionalConnection,
} from '@vendure/core';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
// import { CampaignProducts } from '../../campaign-plugin/entities/campaign-products.entity';
import { WishlistItemType } from '../../wishlist-plugin/entities/wishlist.entity';
import { WishlistService } from '../../wishlist-plugin/services/wishlist.service';
import { ProductCustomFields, ProductVariantCustomFields } from '../gql/generated';
import { ReviewType } from '../../review-plugin/entities/review.entity';
import { ReviewService } from '../../review-plugin/services/review.service';
import { PreOrder } from '../../pre-order-inquiry-plugin/entities/pre-order.entity';

@Injectable()
export class CustomProductService {
  private readonly relations: RelationPaths<Product> = ['channels', 'channels.seller'];
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
    private wishlistService: WishlistService,
    private reviewService: ReviewService,
  ) {}

  getSeller(product: Product): Seller {
    const channel = product?.channels?.find(channel => channel.code !== '__default_channel__');

    if (!channel?.seller) {
      throw new Error(`No seller found for product ${product.id}`);
    }

    return channel?.seller as Seller;
  }

  async getFeaturedProducts(ctx: RequestContext, featuredProduct: boolean) {
    const products = await this.connection.getRepository(ctx, Product).find({
      where: { deletedAt: IsNull(), customFields: { featuredProduct } as any },
    });
    return products;
  }

  async getSellerProducts(ctx: RequestContext, sellerId: ID) {
    const channel = await this.connection
      .getRepository(ctx, Channel)
      .findOne({ where: { sellerId: sellerId } });
    if (!channel) {
      throw new Error('Seller not found');
    }
    const products = await this.connection
      .getRepository(ctx, Product)
      .find({ where: { channels: { id: channel.id }, deletedAt: IsNull() } });
    return products;
  }

  // async getCampaignProducts(ctx: RequestContext, campaignId: ID) {
  //     const campaignProducts = await this.connection
  //         .getRepository(ctx, CampaignProducts)
  //         .findBy({ campaignId: campaignId, deletedAt: IsNull() });

  //     return campaignProducts;
  // }

  // async getCampaignData(ctx: RequestContext, products: Product[]) {
  //     const productIds = products.map(product => product.id);
  //     const campaignProducts = await this.connection.getRepository(ctx, CampaignProducts).find({
  //         where: {
  //             productId: In(productIds),
  //             campaign: {
  //                 startsAt: LessThanOrEqual(new Date()),
  //                 endsAt: MoreThanOrEqual(new Date()),
  //             },
  //             deletedAt: IsNull(),
  //         },
  //         relations: ['campaign'],
  //     });

  //     return products.map(p => {
  //         const campaignProduct = campaignProducts.find(c => c.productId === p.id);
  //         return { ...p, campaignProduct: campaignProduct || null };
  //     });
  // }

  async updateStockTypeFromVariants(ctx: RequestContext, productId: ID): Promise<void> {
    const product = await this.connection.getEntityOrThrow(ctx, Product, productId, {
      relations: ['variants'],
    });

    const variantRepo = this.connection.getRepository(ctx, ProductVariant);
    const stockRepo = this.connection.getRepository(ctx, 'stock_level');
    const preOrderRepo = this.connection.getRepository(ctx, PreOrder);

    const variantIds = product.variants.map(v => v.id);

    const stockEntries = await stockRepo.find({
      where: { productVariantId: In(variantIds) },
    });

    const variantStockMap = new Map<ID, number>();
    for (const stock of stockEntries) {
      const current = variantStockMap.get(stock.productVariantId) ?? 0;
      variantStockMap.set(stock.productVariantId, current + stock.stockOnHand);
    }

    // Check if any variant has accepted pre-orders
    const preOrders = await preOrderRepo.find({
      where: {
        productVariant: { id: In(variantIds) },
        acceptedAt: Not(IsNull()),
        deletedAt: IsNull(),
      },
      relations: ['productVariant'],
    });

    const preOrderVariantIds = new Set(preOrders.map(po => po.productVariant.id));

    let finalStockType: 'available' | 'pre_order' | 'out_of_stock' = 'available';

    const allStockZero = product.variants.every(v => (variantStockMap.get(v.id) ?? 0) <= 0);
    const anyPreOrderWithStock = product.variants.some(
      v => preOrderVariantIds.has(v.id) && (variantStockMap.get(v.id) ?? 0) > 0,
    );

    if (allStockZero) {
      finalStockType = 'out_of_stock';
    } else if (anyPreOrderWithStock) {
      finalStockType = 'pre_order';
    } else {
      finalStockType = 'available';
    }

    for (const variant of product.variants) {
      await this.connection.getRepository(ctx, ProductVariant).update(variant.id, {
        customFields: {
          ...(variant.customFields ?? {}),
          stock_type: finalStockType,
        } as any,
      });
    }
  }

  findAll(
    ctx: RequestContext,
    options?: ListQueryOptions<Product & ProductCustomFields>,
    relations?: RelationPaths<Product>,
  ): Promise<PaginatedList<Product>> {
    const effectiveRelations = unique([...(relations ?? []), ...this.relations]);
    options = {
      ...options,
      filter: {
        ...options?.filter,
      },
    };
    return this.listQueryBuilder
      .build(Product, options, {
        relations: effectiveRelations,
        ctx,
        where: {
          channels: {
            code: Not('__default_channel__'),
          },
          deletedAt: IsNull(),
        },
      })
      .getManyAndCount()
      .then(async ([items, totalItems]) => {
        items = await this.wishlistService.getUserWishlistItems(ctx, WishlistItemType.PRODUCT, items);
        // items = await this.getCampaignData(ctx, items);
        const productIds = items.map(product => product.id);
        const averageRatings = await this.reviewService.getAverageEntityRating(
          ctx,
          productIds,
          ReviewType.PRODUCT,
        );
        return {
          items: items.map(i => {
            const averageRating = averageRatings.find(rating => rating.entityId === i.id);
            return {
              ...i,
              seller: this.getSeller(i),
              averageRating: averageRating?.rating || null,
              reviewCount: averageRating?.reviewCount || null,
            };
          }),
          totalItems,
        };
      });
  }

  findAllVariants(
    ctx: RequestContext,
    productIds: Set<string>,
    options?: ListQueryOptions<ProductVariant & ProductVariantCustomFields>,
    relations?: RelationPaths<ProductVariant>,
  ): Promise<PaginatedList<ProductVariant>> {
    const effectiveRelations = unique([...(relations ?? []), ...this.relations]);
    return this.listQueryBuilder
      .build(ProductVariant, options, {
        relations: effectiveRelations,
        ctx,
        where: {
          channels: {
            code: Not('__default_channel__'),
          },
          deletedAt: IsNull(),
          productId: In(Array.from(productIds)),
        },
      })
      .getManyAndCount()
      .then(async ([items, totalItems]) => {
        return {
          items: items,
          totalItems,
        };
      });
  }
}
