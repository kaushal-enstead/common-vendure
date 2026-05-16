import { Channel, DeepPartial, EntityId, VendureEntity } from '@vendure/core';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class LoyaltySettings extends VendureEntity {
  constructor(input?: DeepPartial<LoyaltySettings>) {
    super(input);
  }

  @Column({ type: 'int', default: 0 })
  pointsPerEuro: number;

  @Column({ type: 'int', default: 0 })
  maxRedeemablePoints: number;

  @Column({ type: 'boolean', default: false })
  enableLoyaltyDiscount: boolean;

  @Column({ type: 'int', default: 0 })
  loyaltyDiscount: number;

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn()
  channel: Channel;

  @EntityId()
  channelId: string;
}
