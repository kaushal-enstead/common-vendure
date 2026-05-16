import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { Asset, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Booking } from './booking.entity';

@Entity()
export class BookingAsset extends VendureEntity {
    constructor(input?: DeepPartial<BookingAsset>) {
        super(input);
    }

    @Column()
    assetId: ID;

    @Index()
    @ManyToOne(type => Asset, { eager: true, onDelete: 'CASCADE' })
    asset: Asset;

    @Column()
    position: number;

    @Column()
    bookingId: ID;

    @Index()
    @ManyToOne(type => Booking, booking => booking.assets, {
        onDelete: 'CASCADE',
    })
    booking: Booking;
}
