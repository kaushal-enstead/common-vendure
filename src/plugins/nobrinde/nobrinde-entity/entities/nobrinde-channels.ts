import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class NobrindeChannel extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeChannel>) {
    super(input);
  }

  @Column({ type: 'varchar', length: 20, nullable: false })
  channel_type: string;

  @Column({ type: 'text', nullable: true })
  config_json: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  created_by: string | null;

  @Column({ type: 'datetime', nullable: false })
  date_created: Date;

  @Column({ type: 'datetime', nullable: false })
  date_updated: Date;

  @Column({ type: 'boolean', nullable: false })
  is_active: boolean;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  slug: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by: string | null;
}
