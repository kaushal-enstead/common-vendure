import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class SyncTable extends VendureEntity {
  constructor(input?: DeepPartial<SyncTable>) {
    super(input);
  }

  @Column({ unique: true })
  tableName: string;

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt: Date | null = null;
}
