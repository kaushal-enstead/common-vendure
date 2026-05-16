import { CustomerEvent, CustomerService } from '@vendure/core';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@vendure/core';
import { loggerCtx, CUSTOMER_SYNC_PLUGIN_OPTIONS } from '../constants';
import { PluginInitOptions } from '../types';
import { SyncService } from '../services/sync-service';

@Injectable()
export class CustomerEventListener implements OnModuleInit {
  constructor(
    private eventBus: EventBus,
    private syncService: SyncService,
    private customerService: CustomerService,
    @Inject(CUSTOMER_SYNC_PLUGIN_OPTIONS) private options: PluginInitOptions,
  ) {
    const customersConfig = this.options.tables.find(table => table.name === 'VENTIDADES')!;
    this.syncService.setConfig(customersConfig);
  }

  onModuleInit() {
    this.eventBus.ofType(CustomerEvent).subscribe({
      next: async event => {
        try {
          const { type, entity, input } = event;
          Logger.debug('CustomerEventListener type: ', type);
          switch (type) {
            case 'created': {
              if (entity.customFields?.mappingId) {
                // skip as we already have the mapping id, so we don't need to create it again
                return;
              }

              // create the customer in the external database
              const remoteData = await this.syncService.create(entity);

              await this.customerService.update(event.ctx, {
                id: entity.id,
                customFields: { mappingId: remoteData.insertId },
              });
              break;
            }
            case 'updated': {
              if (input && 'mappingId' in (input as any).customFields) {
                // skip as we updating the mapping id
                return;
              }

              if (!entity.customFields?.mappingId) {
                // create the customer in the external database if mapping id is not set
                await this.syncService.create(entity);
                return;
              }
              await this.syncService.update(entity.customFields?.mappingId, entity);
              break;
            }
            case 'deleted': {
              // if (entity.customFields?.mappingId) {
              //   // delete the customer from the external database if needed
              //   await this.externalDbHelper.delete(entity.customFields?.mappingId);
              // }
              break;
            }

            default:
              break;
          }
        } catch (err) {
          Logger.error('CustomerEventListener failed: ' + err, loggerCtx);
        }
      },
      error: err => {
        Logger.error('CustomerEventListener subscription failed: ' + err, loggerCtx);
      },
    });
  }
}
