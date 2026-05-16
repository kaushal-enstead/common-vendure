import { Customer, CustomerService, EventBus, RequestContext, TransactionalConnection } from '@vendure/core';
import { Inject, Injectable } from '@nestjs/common';
import { LOYALTY_POINTS_PLUGIN_OPTIONS } from '../constants';
import { PluginInitOptions } from '../types';
import { AllocateLoyaltyPointsInput, Tree } from '../gql/generated';
import { LoyaltyWalletHistory, LoyaltyWalletHistoryType } from '../entities/loyalty-wallet-history.entity';
import { LoyaltyPointsRewardEvent } from '../events/event-types';

@Injectable()
export class CustomerGroupsService {
  constructor(
    private connection: TransactionalConnection,
    private customerService: CustomerService,
    private eventBus: EventBus,
    @Inject(LOYALTY_POINTS_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {}

  async getCustomerGroups(ctx: RequestContext): Promise<Tree[]> {
    /**
     * Use a CTE to get all groups and their customers, and also ungrouped customers.
     * Then aggregate in SQL to build the children arrays for each group.
     * The result will be an array of groups, each with a JSON array of children.
     * We'll also add an "Ungrouped" group for customers not in any group.
     */
    const raw = await this.connection.rawConnection.query(`
      WITH grouped_customers AS (
        SELECT
          cg.id AS group_id,
          cg.name AS group_name,
          c.id AS customer_id,
          c.firstName AS first_name,
          c.lastName AS last_name
        FROM customer_group cg
        LEFT JOIN customer_groups_customer_group cg_link ON cg.id = cg_link.customerGroupId
        LEFT JOIN customer c ON c.id = cg_link.customerId
      ),
      ungrouped_customers AS (
        SELECT
          NULL AS group_id,
          'Ungrouped' AS group_name,
          c.id AS customer_id,
          c.firstName AS first_name,
          c.lastName AS last_name
        FROM customer c
        LEFT JOIN customer_groups_customer_group cg_link ON c.id = cg_link.customerId
        WHERE cg_link.customerGroupId IS NULL
      ),
      all_groups AS (
        SELECT * FROM grouped_customers
        UNION ALL
        SELECT * FROM ungrouped_customers
      )
      SELECT
        COALESCE(group_id, 'ungrouped') AS id,
        COALESCE(group_name, 'Ungrouped') AS name,
        IFNULL(
          JSON_ARRAYAGG(
            IF(
              customer_id IS NOT NULL,
              JSON_OBJECT(
                'id', customer_id,
                'name', TRIM(CONCAT_WS(' ', IFNULL(first_name, ''), IFNULL(last_name, '')))
              ),
              NULL
            )
          ),
          JSON_ARRAY()
        ) AS children
      FROM all_groups
      GROUP BY id, name
      ORDER BY
        CASE WHEN id = 'ungrouped' THEN 1 ELSE 0 END, name
    `);

    return raw.map((row: Tree) => ({
      id: `group-${row.id}`,
      name: row.name,
      children: Array.isArray(row.children) ? row.children?.filter(Boolean) : JSON.parse(row.children),
    }));
  }

  async allocateLoyaltyPoints(outerCtx: RequestContext, input: AllocateLoyaltyPointsInput) {
    const { points, customerIds } = input;
    if (!customerIds.length) {
      return false;
    }

    await this.connection.withTransaction(outerCtx, async ctx => {
      for (const customerId of customerIds) {
        const customer = await this.customerService.findOne(ctx, customerId);
        if (!customer) {
          throw new Error('Customer not found');
        }
        const prevBalance = customer.customFields.points;
        const balanceAfter = prevBalance + points;

        const loyaltyWalletHistory = await this.connection.getRepository(ctx, LoyaltyWalletHistory).save({
          customerId: customer.id,
          points,
          balanceAfter,
          prevBalance,
          orderId: null,
          source: 'reward',
          type: LoyaltyWalletHistoryType.REWARD,
        });

        const history = Array.isArray(customer.customFields.history) ? customer.customFields.history : [];
        history.push(loyaltyWalletHistory as never);
        customer.customFields.points = balanceAfter;
        customer.customFields.history = history;
        await this.connection.getRepository(ctx, Customer).save(customer, { reload: false });

        this.eventBus.publish(new LoyaltyPointsRewardEvent(ctx, customer.emailAddress, points, balanceAfter));
      }
    });
    return true;
  }
}
