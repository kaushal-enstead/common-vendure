import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransactionalConnection, Order } from '@vendure/core';

@Injectable()
export class ActiveCartJanitorService implements OnModuleInit {
  constructor(private connection: TransactionalConnection) {}

  async onModuleInit() {
    // Runs once at startup: disables carts that should no longer be active
    await this.connection
      .getRepository<Order>('Order')
      .createQueryBuilder()
      .update()
      .set({ active: false } as any)
      .where('active = :active', { active: true })
      .andWhere('state IN (:...states)', { states: ['PaymentAuthorized', 'PaymentSettled'] })
      .execute();
  }
}
