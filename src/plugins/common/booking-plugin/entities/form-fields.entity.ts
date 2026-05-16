import { DeepPartial, LocaleString, Translatable, Translation, VendureEntity } from '@vendure/core';
import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { FormFieldTranslation, FormTranslation } from './form-field-translation.entity';

export enum EFormField {
    TEXT = 'TEXT',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    DATE = 'DATE',
    TIME = 'TIME',
    LIST = 'LIST',
    LONG_TEXT = 'LONG_TEXT',
}

export interface Option {
    key: string;
    label: string;
}

@Entity()
export class FormField extends VendureEntity implements Translatable {
    constructor(input?: DeepPartial<FormField>) {
        super(input);
    }

    label: LocaleString;
    description: LocaleString;
    options: Option[];

    @Column()
    name: string;

    @Column()
    type: string;

    @ManyToMany(() => Form, form => form.fields)
    @JoinTable()
    forms: Form[];

    @OneToMany(type => FormFieldTranslation, translation => translation.base, { eager: true })
    translations: Array<Translation<FormFieldTranslation>>;
}

@Entity()
export class Form extends VendureEntity implements Translatable {
    constructor(input?: DeepPartial<Form>) {
        super(input);
    }

    name: LocaleString;
    description: LocaleString;

    @ManyToMany(() => FormField, formField => formField.forms)
    fields: FormField[];

    @DeleteDateColumn({ type: Date, nullable: true })
    deletedAt: Date | null;

    @OneToMany(type => FormTranslation, translation => translation.base, {
        eager: true,
    })
    translations: Array<Translation<FormTranslation>>;
}
