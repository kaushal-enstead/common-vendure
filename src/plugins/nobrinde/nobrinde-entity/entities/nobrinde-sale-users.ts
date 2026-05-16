import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class NobrindeSaleUser extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeSaleUser>) {
    super(input);
  }

  @Column({ type: 'int', nullable: false })
  id_vendedor: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sigla: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telemovel: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;
}
