import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class NobrindeOrder extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeOrder>) {
    super(input);
  }
  @Column({ type: 'int' })
  id_phc: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  id_site: string | null;

  @Column({ type: 'int', nullable: true })
  nr_doc_pv: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  data_documento: string | null;

  @Column({ type: 'int', nullable: true })
  tipo_reg: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serie: string | null;

  @Column({ type: 'int', nullable: true })
  nr_entidade: number | null;

  @Column({ type: 'int', nullable: true })
  estabelecimento: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  empresa: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  morada: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  localidade: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  c_postal: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nif: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cond_pagamento: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  morada_entrega: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  data_expedicao: string | null;

  @Column({ type: 'double precision', nullable: true })
  total_liq: number | null;

  @Column({ type: 'double precision', nullable: true })
  iva: number | null;

  @Column({ type: 'double precision', nullable: true })
  taxa_iva: number | null;

  @Column({ type: 'double precision', nullable: true })
  total: number | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'text', nullable: true })
  sigla_comercial: string | null;

  @Column({ type: 'double precision', nullable: true })
  desc_comercial: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tracking: string | null;

  @OneToMany(() => NobrindeOrderLine, line => line.order)
  lines: NobrindeOrderLine[];
}

@Entity()
export class NobrindeOrderLine extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeOrderLine>) {
    super(input);
  }

  @ManyToOne(() => NobrindeOrder, o => o.lines, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: NobrindeOrder | null;

  @Column({ type: 'int' })
  id_phc: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  id_linhas: string;

  @Column({ type: 'int', nullable: true })
  ordem: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referencia_externa: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referencia: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nome_produto: string | null;

  @Column({ type: 'int', nullable: true })
  qtdd: number | null;

  @Column({ type: 'double precision', nullable: true })
  preco_unit: number | null;

  @Column({ type: 'double precision', nullable: true })
  desc: number | null;

  @Column({ type: 'int', nullable: true })
  preco_unit_desc: number | null;

  @Column({ type: 'double precision', nullable: true })
  total: number | null;

  @Column({ type: 'double precision', nullable: true })
  iva: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado: string | null;
}
