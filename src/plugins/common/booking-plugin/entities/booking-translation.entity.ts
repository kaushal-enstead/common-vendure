import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Booking } from './booking.entity';

interface SeoInput {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
}

@Entity()
export class BookingTranslation extends VendureEntity implements Translation<Booking> {
    constructor(input?: DeepPartial<Translation<BookingTranslation>>) {
        super(input);
    }

    @Column('varchar')
    languageCode: LanguageCode;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({ type: 'json' })
    seo: SeoInput;

    @Column({ nullable: true })
    description: string;

    @Index()
    @ManyToOne(type => Booking, base => base.translations, {
        onDelete: 'CASCADE',
    })
    base: Booking;
}
