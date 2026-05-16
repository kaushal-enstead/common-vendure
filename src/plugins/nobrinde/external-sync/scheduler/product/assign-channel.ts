import { TransactionalConnection, Channel } from '@vendure/core';

export async function assignChannels(
  connection: TransactionalConnection,
  defaultChannel: Channel | null,
  type: 'product' | 'variant' | 'asset' | 'product_option_group' | 'product_option',
  ids: string[],
) {
  if (!defaultChannel) return;

  if (type === 'variant') {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_variant_channels_channel')
      .values(
        ids.map(id => ({
          productVariantId: id,
          channelId: defaultChannel.id,
        })),
      )
      .orIgnore()
      .execute();
  } else if (type === 'product') {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_channels_channel')
      .values(
        ids.map(id => ({
          productId: id,
          channelId: defaultChannel.id,
        })),
      )
      .orIgnore()
      .execute();
  } else if (type === 'asset') {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('asset_channels_channel')
      .values(
        ids.map(id => ({
          assetId: id,
          channelId: defaultChannel.id,
        })),
      )
      .orIgnore()
      .execute();
  } else if (type === 'product_option_group') {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_option_group_channels_channel')
      .values(
        ids.map(id => ({
          productOptionGroupId: id,
          channelId: defaultChannel.id,
        })),
      )
      .orIgnore()
      .execute();
  } else if (type === 'product_option') {
    await connection.rawConnection
      .createQueryBuilder()
      .insert()
      .into('product_option_channels_channel')
      .values(
        ids.map(id => ({
          productOptionId: id,
          channelId: defaultChannel.id,
        })),
      )
      .orIgnore()
      .execute();
  }
}
