import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import {
  Asset,
  Channel,
  ChannelAware,
  Customer,
  EntityId,
  FacetValue,
  LocaleString,
  SoftDeletable,
  Translatable,
  Translation,
  VendureEntity,
} from '@vendure/core';
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { KitAsset } from './kit-asset.entity';
import { KitTranslation } from './kit-translation.entity';
import { KitVariant } from './kit-variant.entity';

export enum KitType {
  Admin = 'Admin',
  Customer = 'Customer',
}

/**
 * @description
 * A Kit contains one or more {@link KitVariant}s and serves as a container for those variants,
 * providing an overall name, description etc.
 *
 * @docsCategory entities
 */
@Entity()
export class Kit extends VendureEntity implements Translatable, ChannelAware, SoftDeletable {
  constructor(input?: DeepPartial<Kit>) {
    super(input);
  }

  @Column({ type: Date, nullable: true })
  deletedAt: Date | null;

  name: LocaleString;

  slug: LocaleString;

  description: LocaleString;

  @Column('varchar', { default: KitType.Admin })
  type: KitType;

  @Column({ default: true })
  enabled: boolean;

  // @Column({ default: 0 })
  // discount: number;

  @Index()
  // @ManyToOne(type => Customer, customer => customer.orders)
  @ManyToOne(type => Customer)
  customer?: Customer;

  @EntityId({ nullable: true })
  customerId?: ID;

  @Index()
  @ManyToOne(type => Asset, { onDelete: 'SET NULL' })
  featuredAsset: Asset;

  @EntityId({ nullable: true })
  featuredAssetId: ID;

  @OneToMany(type => KitAsset, kitAsset => kitAsset.kit)
  assets: KitAsset[];

  @OneToMany(type => KitTranslation, translation => translation.base, { eager: true })
  translations: Array<Translation<Kit>>;

  @OneToMany(type => KitVariant, variant => variant.kit)
  variants: KitVariant[];

  @ManyToMany(type => FacetValue)
  @JoinTable()
  facetValues: FacetValue[];

  @ManyToMany(type => Channel)
  @JoinTable()
  channels: Channel[];
}
