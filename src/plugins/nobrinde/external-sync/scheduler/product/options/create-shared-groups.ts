import {
  TransactionalConnection,
  Channel,
  ProductOptionGroup,
  ProductOptionGroupTranslation,
  LanguageCode,
} from '@vendure/core';
import { LanguageRow } from '../types';
import { In } from 'typeorm';
import { assignChannels } from '../assign-channel';
import { variantOptionConfigs } from '../constants';

export async function createSharedGroups(
  connection: TransactionalConnection,
  languageCodes: (keyof LanguageRow)[],
  defaultChannel?: Channel | null,
) {
  const optionGroupRepo = connection.rawConnection.getRepository(ProductOptionGroup);
  const optionGroupTranslationRepo = connection.rawConnection.getRepository(ProductOptionGroupTranslation);

  const allGroupIds = variantOptionConfigs.map(c => `og-${c.code}`);

  const existingGroups = await optionGroupRepo.find({
    select: { id: true },
    where: { id: In(allGroupIds) },
  });
  const existingIds = new Set(existingGroups.map(g => String(g.id)));

  const newConfigs = variantOptionConfigs.filter(c => !existingIds.has(`og-${c.code}`));
  if (!newConfigs.length) return;

  const newGroups = newConfigs.map(
    config => new ProductOptionGroup({ id: `og-${config.code}`, code: config.code }),
  );

  const newTranslations = newConfigs.flatMap(config =>
    languageCodes.map(
      lang =>
        new ProductOptionGroupTranslation({
          languageCode: lang as LanguageCode,
          name: config.names[lang as string],
          base: { id: `og-${config.code}` },
        }),
    ),
  );

  await optionGroupRepo.insert(newGroups);
  await optionGroupTranslationRepo.insert(newTranslations);

  if (defaultChannel) {
    await assignChannels(
      connection,
      defaultChannel,
      'product_option_group',
      newGroups.map(g => String(g.id)),
    );
  }
}
