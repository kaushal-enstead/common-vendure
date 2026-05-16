import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class NobrindeBudget extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeBudget>) {
    super(input);
  }

  @Column({ type: 'int' })
  id_phc: number;

  @Column({ type: 'int', nullable: true })
  id_site: number | null;

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  morada: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  localidade: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  c_postal: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nif: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cond_pagamento: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  morada_entrega: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  data_expedicao: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  total_liq: string | null;

  @Column({ type: 'double precision', nullable: true })
  iva: number | null;

  @Column({ type: 'double precision', nullable: true })
  taxa_iva: number | null;

  @Column({ type: 'double precision', nullable: true })
  total: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacoes: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sigla_comercial: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  desc_comercial: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  tracking: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  pdfAssetId: string | null;

  @OneToMany(() => NobrindeBudgetLine, line => line.budget)
  lines: NobrindeBudgetLine[];
}

@Entity()
export class NobrindeBudgetLine extends VendureEntity {
  constructor(input?: DeepPartial<NobrindeBudgetLine>) {
    super(input);
  }

  @ManyToOne(() => NobrindeBudget, b => b.lines, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'budgetId' })
  budget: NobrindeBudget | null;

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

  @Column({ type: 'double precision', nullable: true })
  preco_unit_desc: number | null;

  @Column({ type: 'double precision', nullable: true })
  total: number | null;

  @Column({ type: 'double precision', nullable: true })
  iva: number | null;
}
