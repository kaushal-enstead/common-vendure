import {
    Asset,
    Channel,
    ChannelAware,
    Collection,
    FacetValue,
    LocaleString,
    Seller,
    SoftDeletable,
    Translatable,
    Translation,
    VendureEntity,
} from '@vendure/core';
import {
    Column,
    DeepPartial,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { BookingAsset } from './booking-asset.entity';
import { BookingOrder } from './booking-order.entity';
import { BookingTranslation } from './booking-translation.entity';
import { Form } from './form-fields.entity';

type AvailableDaysInput = {
    friday?: boolean | null;
    monday?: boolean | null;
    saturday?: boolean | null;
    sunday?: boolean | null;
    thursday?: boolean | null;
    tuesday?: boolean | null;
    wednesday?: boolean | null;
};

interface SeoInput {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
}

type SlotInput = {
    from?: string | null;
    to?: string | null;
};

@Entity()
export class Booking extends VendureEntity implements SoftDeletable, ChannelAware, Translatable {
    constructor(input?: DeepPartial<Booking>) {
        super(input);
    }

    seller: Seller;
    name: LocaleString;
    slug: LocaleString;
    description: LocaleString;
    seo: SeoInput;
    isFavorite: boolean;
    averageRating: number | null;
    reviewCount: number | null;
    @Column({ type: 'json' })
    availableHours: Array<SlotInput>;

    @Column({ type: 'json' })
    availableDays: AvailableDaysInput;

    @Column({ default: true })
    enabled: boolean;

    @ManyToOne(() => Form, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    form: Form;

    @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    featuredAsset: Asset;

    @OneToMany(type => BookingAsset, asset => asset.booking)
    assets: BookingAsset[];

    @DeleteDateColumn({ type: Date, nullable: true })
    deletedAt: Date | null;

    @ManyToMany(() => Channel)
    @JoinTable()
    channels: Channel[];

    @ManyToOne(() => Collection, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    collection: Collection;

    @ManyToMany(type => FacetValue)
    @JoinTable()
    facetValues: FacetValue[];

    @OneToMany(() => BookingOrder, order => order.booking)
    orders: BookingOrder[];

    @OneToMany(type => BookingTranslation, translation => translation.base, {
        eager: true,
    })
    translations: Array<Translation<Booking>>;
}
