import { DeepPartial, EntityId, ID, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

export enum LoyaltyWalletHistoryType {
  EARN = 'earn',
  REDEEM = 'redeem',
  REWARD = 'reward',
}

@Entity()
export class LoyaltyWalletHistory extends VendureEntity {
  constructor(input?: DeepPartial<LoyaltyWalletHistory>) {
    super(input);
  }

  @EntityId()
  customerId: ID;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 0 })
  balanceAfter: number;

  @Column({ type: 'int', default: 0 })
  prevBalance: number;

  @Column()
  type: string;

  @EntityId({ nullable: true })
  orderId: ID | null;

  @Column()
  source: string;
}
