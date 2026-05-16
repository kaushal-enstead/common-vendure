import {
  Address,
  Customer,
  CustomerService,
  EmailAddressConflictError,
  ID,
  LanguageCode,
  RequestContext,
  TransactionalConnection,
} from '@vendure/core';
import { RegionTranslation } from '@vendure/core/dist/entity/region/region-translation.entity';
import { SyncService } from '../services/sync-service';
import { SyncResult } from '../types';

export async function getEnglishRegionTranslations(
  connection: TransactionalConnection,
): Promise<RegionTranslation[]> {
  return connection.rawConnection
    .createQueryBuilder(RegionTranslation, 'region')
    .leftJoinAndSelect('region.base', 'base')
    .where('region.languageCode = :languageCode', { languageCode: LanguageCode.en })
    .select(['region.id', 'region.name', 'base.id'])
    .getMany();
}

/**
 * Applies mapped customer rows (+ optional address extras) from the external DB into Vendure.
 * When `knownCustomers` is set (manual sync), only those customers are updated by matching `mappingId`;
 * the scheduled task omits it and resolves existing rows from the DB as before.
 */
export async function applyCustomerExternalRows(
  ctx: RequestContext,
  connection: TransactionalConnection,
  customerService: CustomerService,
  syncService: SyncService,
  regions: RegionTranslation[],
  rows: Partial<Customer>[],
  extraRows: Record<string, unknown>[],
  resultObject: Pick<SyncResult, 'updatedRows' | 'insertedRows' | 'failedRows' | 'failedData'>,
  knownCustomers?: Customer[],
): Promise<void> {
  const handleAddressUpsert = async (fk: ID, input: Record<string, unknown>) => {
    if (!syncService.tableConfig.extraTable?.fields) {
      return;
    }
    const existingAddress = await connection.rawConnection.getRepository(Address).findOne({
      where: { customer: { id: fk } },
    });
    if (existingAddress) {
      await connection.rawConnection.getRepository(Address).update(existingAddress.id, input);
    } else {
      const addressData = new Address({
        ...input,
        streetLine1: (input.streetLine1 as string) ?? '',
        customer: { id: fk },
        country: { id: regions.find(r => r.name === input.province)?.base?.id ?? regions?.[0]?.base?.id },
      });
      await connection.rawConnection.getRepository(Address).save(addressData);
    }
  };

  const existingCustomers =
    knownCustomers ??
    (await connection.rawConnection.getRepository(Customer).find({
      where: rows
        .filter(r => r.customFields?.mappingId)
        .map(r => ({ customFields: { mappingId: r.customFields?.mappingId } })),
    }));

  const deferredPromises: Promise<unknown>[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const extraRow = extraRows[i];
    const existingRow = existingCustomers.find(
      c => c.customFields?.mappingId == row.customFields?.mappingId,
    );
    if (!row.lastName) {
      row.lastName = '';
    }
    if (!row.createdAt) {
      row.createdAt = new Date();
    }
    if (existingRow) {
      deferredPromises.push(customerService.update(ctx, { ...row, id: existingRow.id }));
      deferredPromises.push(handleAddressUpsert(existingRow.id, extraRow));
      resultObject.updatedRows!++;
    } else if (!knownCustomers) {
      deferredPromises.push(
        (async () => {
          const customer = await customerService.create(ctx, row as Parameters<CustomerService['create']>[1]);
          if (customer instanceof EmailAddressConflictError) {
            resultObject.failedRows!++;
            resultObject.failedData?.push({ row, message: customer.message });
            return;
          }
          if (!(customer instanceof Customer)) {
            resultObject.failedRows!++;
            resultObject.failedData?.push({
              row,
              message: (customer as { message?: string }).message ?? 'Customer create failed',
            });
            return;
          }
          resultObject.insertedRows!++;
          return handleAddressUpsert(customer.id, extraRow);
        })(),
      );
    }
  }

  await Promise.all(deferredPromises);
}
