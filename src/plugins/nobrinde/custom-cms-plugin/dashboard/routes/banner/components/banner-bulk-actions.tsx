import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignBannersToChannelDocument,
  deleteBannersDocument,
  removeBannersFromChannelDocument,
} from '../banner.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteBannersBulkAction = ({
  selection,
  table,
  onSuccess,
}: {
  selection: any[];
  table: any;
  onSuccess: () => void;
}) => {
  return (
    <DeleteBulkAction
      mutationDocument={deleteBannersDocument}
      entityName="banner"
      requiredPermissions={['DeleteBanner']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignBannersToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="banner"
      mutationFn={api.mutate(assignBannersToChannelDocument)}
      requiredPermissions={['UpdateBanner']}
      buildInput={(channelId: string) => ({
        bannerIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveBannersFromChannelBulkAction = ({
  selection,
  table,
  onSuccess = () => {},
}: {
  selection: any[];
  table: any;
  onSuccess: () => void;
}) => {
  const { activeChannel } = useChannel() as { activeChannel: any | null };

  if (!activeChannel) {
    return null;
  }
  return (
    <RemoveFromChannelBulkAction
      selection={selection}
      table={table}
      entityType="banner"
      mutationFn={api.mutate(removeBannersFromChannelDocument)}
      requiredPermissions={['UpdateBanner']}
      buildInput={() => ({
        bannerIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
