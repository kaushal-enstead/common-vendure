import { Channel, Customer, DeepPartial, EntityId, VendureEntity } from '@vendure/core';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SupportSubject } from './support-subject.entity';

enum SupportTicketPriority {
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  URGENT = 'URGENT',
}

enum SupportTicketStatus {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  PENDING = 'PENDING',
}

enum SupportTicketSender {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
}

@Entity()
export class SupportTicket extends VendureEntity {
  constructor(input?: DeepPartial<SupportTicket>) {
    super(input);
  }

  @Column('text')
  description: string;

  @Column({ default: SupportTicketStatus.OPEN })
  status: SupportTicketStatus;

  @Column({ default: SupportTicketPriority.LOW })
  priority: SupportTicketPriority;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @EntityId()
  customerId: string;

  @ManyToOne(() => SupportSubject)
  @JoinColumn()
  subject: SupportSubject;

  @EntityId()
  subjectId: string;

  @Column('json', { nullable: true })
  messages: Array<{
    id: string;
    content: string;
    sender: SupportTicketSender;
    senderId: string;
    timestamp: Date;
    ticketId: string;
  }>;

  @ManyToOne(() => Channel, { eager: true })
  @JoinColumn()
  channel: Channel;

  @EntityId()
  channelId: string;
}
