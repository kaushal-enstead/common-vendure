import { LanguageCode } from '@vendure/common/lib/generated-types';
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { Translation, VendureEntity } from '@vendure/core';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Alert, AlertButton } from './alert.entity';

@Entity('payload_alert_translation')
export class AlertTranslation extends VendureEntity implements Translation<Alert> {
  constructor(input?: DeepPartial<Translation<Alert>>) {
    super(input);
  }

  @Column('varchar') languageCode: LanguageCode;

  @Column({ type: 'varchar', length: 1024 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  targetUrls: string[];

  @Column({ type: 'json', nullable: true })
  button?: AlertButton;

  @Index()
  @ManyToOne(type => Alert, base => base.translations, { onDelete: 'CASCADE' })
  base: Alert;
}
