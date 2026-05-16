import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Kit } from './kit.entity';
import { ProductVariant, VendureEntity } from '@vendure/core';

@Entity()
export class KitVariant extends VendureEntity {
  constructor(input?: DeepPartial<KitVariant>) {
    super(input);
  }
  @Column()
  kitId: ID;

  @Index()
  @ManyToOne(type => Kit, kit => kit.variants, { onDelete: 'CASCADE' })
  kit: Kit;

  @Column()
  productVariantId: ID;

  @Index()
  @ManyToOne(type => ProductVariant, { onDelete: 'CASCADE' })
  productVariant: ProductVariant;

  @Column()
  quantity: number;

  @Column({ default: 0 })
  discount: number;
}
