import { Customer, DeepPartial, EntityId, ID, SoftDeletable, VendureEntity } from '@vendure/core';
import { Column, DeleteDateColumn, Entity, Index, ManyToOne } from 'typeorm';
import { Booking } from './booking.entity';

export enum EBookingOrderStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REFUSED = 'refused',
    CHANGE_PROPOSED = 'change_proposed',
}

interface BookingOrderComment {
    type: string;
    message: string;
    createdAt: Date;
}

interface FormValues {
    fieldId: string;
    value: string;
}

@Entity()
export class BookingOrder extends VendureEntity implements SoftDeletable {
    constructor(input?: DeepPartial<BookingOrder>) {
        super(input);
    }

    @Index()
    @ManyToOne(type => Booking, booking => booking.orders)
    booking: Booking;

    @EntityId({ nullable: true })
    bookingId: ID;

    @Index()
    @ManyToOne(type => Customer, { onDelete: 'CASCADE' })
    customer: Customer;

    @EntityId({ nullable: true })
    customerId: ID;

    /**
     * @description
     * Whether the Order is considered "active", meaning that the
     * Customer can still make changes to it
     */
    @Column({
        default: EBookingOrderStatus.PENDING,
        // type: "enum",
        // enum: EBookingOrderStatus,
    })
    status: string;

    @DeleteDateColumn({ type: Date, nullable: true })
    deletedAt: Date | null;

    // @Column({ type: Date, nullable: false })
    // scheduleAt: Date | null;

    @Column({ type: 'json' })
    comments: BookingOrderComment[];

    @Column({ type: 'json' })
    formValues: FormValues[];
}
