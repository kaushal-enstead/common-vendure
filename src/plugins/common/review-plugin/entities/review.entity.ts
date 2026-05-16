import { Customer, DeepPartial, ID, Product, Seller, VendureEntity, SoftDeletable } from '@vendure/core';
import { Column, Entity, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Booking } from '../../booking-plugin/entities/booking.entity';

export enum ReviewType {
    SELLER = 'SELLER',
    PRODUCT = 'PRODUCT',
    BOOKING = 'BOOKING',
}

@Entity()
export class Review extends VendureEntity implements SoftDeletable {
    constructor(input?: DeepPartial<Review>) {
        super(input);
    }

    @Column()
    type: ReviewType;

    @Column({ nullable: true })
    comment: string;

    @Column({ default: true })
    public: boolean;

    @Column({ nullable: true, type: 'float' })
    rating: number;

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

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date | null;
}
