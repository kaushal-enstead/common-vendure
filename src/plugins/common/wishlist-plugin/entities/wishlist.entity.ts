import { Customer, ID, Product, Seller, VendureEntity } from '@vendure/core';
import { Column, DeepPartial, Entity, ManyToOne } from 'typeorm';
import { Booking } from '../../booking-plugin/entities/booking.entity';

export enum WishlistItemType {
  SELLER = 'SELLER',
  PRODUCT = 'PRODUCT',
  BOOKING = 'BOOKING',
}

@Entity()
export class Wishlist extends VendureEntity {
  constructor(input?: DeepPartial<Wishlist>) {
    super(input);
  }

  @Column()
  type: WishlistItemType;

  @Column({ nullable: true })
  sellerId?: ID;

  @Column({ nullable: true })
  productId?: ID;

  @Column({ nullable: true })
  bookingId?: ID;

  @Column({ nullable: true })
  customerId: ID;

  @ManyToOne(() => Customer)
  customer: Customer;

  @ManyToOne(() => Seller, { nullable: true })
  seller?: Seller;

  @ManyToOne(() => Product, { nullable: true })
  product?: Product;

  @ManyToOne(() => Booking, { nullable: true })
  booking?: Booking;
}
