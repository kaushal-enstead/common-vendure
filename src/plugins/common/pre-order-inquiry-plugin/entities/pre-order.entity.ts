import {
    DeepPartial,
    VendureEntity,
    Channel,
    ProductVariant,
    SoftDeletable,
    ChannelAware,
    EntityId,
    ID,
    Customer,
} from '@vendure/core';
import { Column, DeleteDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum EPreOrderStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    CUSTOMER_ACCEPTED = 'CUSTOMER_ACCEPTED',
    REFUSED = 'REFUSED',
    CHANGE_PROPOSED = 'CHANGE_PROPOSED',
    COMPLETED = 'COMPLETED',
}

@Entity()
export class PreOrder extends VendureEntity implements SoftDeletable, ChannelAware {
    constructor(input?: DeepPartial<PreOrder>) {
        super(input);
    }

    @Column('decimal', { precision: 10, scale: 2, default: 1 })
    quantity: number;

    @Index()
    @ManyToOne(type => Customer, { onDelete: 'SET NULL' })
    customer: Customer;

    @EntityId({ nullable: true })
    customerId: ID;

    @DeleteDateColumn({ type: Date, nullable: true })
    deletedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    acceptedAt: Date | null;

    @ManyToMany(() => Channel)
    @JoinTable()
    channels: Channel[];

    @ManyToOne(() => ProductVariant, { eager: true, nullable: false })
    productVariant: ProductVariant;

    @Column({
        default: EPreOrderStatus.PENDING,
    })
    status: EPreOrderStatus;

    @Column('text', { nullable: true })
    message: string;
}
