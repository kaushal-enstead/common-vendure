import { DeepPartial, LanguageCode, Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Form, FormField, Option } from './form-fields.entity';

@Entity()
export class FormFieldTranslation extends VendureEntity implements Translation<FormField> {
    constructor(input?: DeepPartial<Translation<FormFieldTranslation>>) {
        super(input);
    }

    @Column('varchar')
    languageCode: LanguageCode;

    @Column()
    label: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'json' })
    options: Option[];

    @ManyToOne(type => FormField, base => base.translations, {
        onDelete: 'CASCADE',
    })
    base: FormField;
}

@Entity()
export class FormTranslation extends VendureEntity implements Translation<Form> {
    constructor(input?: DeepPartial<FormTranslation>) {
        super(input);
    }

    @Column('varchar')
    languageCode: LanguageCode;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(type => Form, base => base.translations, {
        onDelete: 'CASCADE',
    })
    base: Form;
}
