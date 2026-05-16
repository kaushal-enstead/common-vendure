import {
  TransactionalConnection,
  Channel,
  LanguageCode,
  ProductOption,
  ProductOptionTranslation,
} from '@vendure/core';
import { LanguageRow, ProductRow } from '../types';
import { In } from 'typeorm';
import { assignChannels } from '../assign-channel';
import { variantOptionConfigs } from '../constants';
import { parseJson, slugify } from '../../../utils/helper';

export async function createSharedOptions(
  connection: TransactionalConnection,
  languageCodes: (keyof LanguageRow)[],
  rows: ProductRow[],
  defaultChannel?: Channel | null,
) {
  const optionRepo = connection.rawConnection.getRepository(ProductOption);
  const optionTranslationRepo = connection.rawConnection.getRepository(ProductOptionTranslation);

  // Collect all unique values across all products/variants
  const candidateMap = new Map<string, { code: string; groupId: string; names: Record<string, string> }>();

  for (const row of rows) {
    const variants = parseJson<ProductRow[]>(row.variants) ?? [];

    for (const config of variantOptionConfigs) {
      const groupId = `og-${config.code}`;

      for (const v of variants) {
        const value = config.valueKeys.map(k => (v as any)[k]).find(val => val);
        if (!value) continue;

        const code = slugify(value);
        const optionId = `opt-${config.code}-${code}`; // shared — no productId
        if (candidateMap.has(optionId)) continue;

        const names: Record<string, string> = {};
        for (const lang of languageCodes) {
          names[lang as string] = (v as any)[`${config.code}_${lang}`] || value;
        }

        candidateMap.set(optionId, { code, groupId, names });
      }
    }
  }

  if (!candidateMap.size) return;

  // Find which ones already exist
  const allOptionIds = [...candidateMap.keys()];
  const existingOptions = await optionRepo.find({
    select: { id: true },
    where: { id: In(allOptionIds) },
  });
  const existingIds = new Set(existingOptions.map(o => String(o.id)));

  const newEntries = [...candidateMap.entries()].filter(([id]) => !existingIds.has(id));
  if (!newEntries.length) return;

  const newOptions = newEntries.map(([id, { code, groupId }]) => new ProductOption({ id, code, groupId }));

  const newTranslations = newEntries.flatMap(([id, { names }]) =>
    languageCodes.map(
      lang =>
        new ProductOptionTranslation({
          languageCode: lang as LanguageCode,
          name: names[lang as string],
          base: { id },
        }),
    ),
  );

  await optionRepo.insert(newOptions);
  await optionTranslationRepo.insert(newTranslations);

  if (defaultChannel) {
    await assignChannels(
      connection,
      defaultChannel,
      'product_option',
      newOptions.map(o => String(o.id)),
    );
  }
}
