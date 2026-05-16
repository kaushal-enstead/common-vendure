import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignNewsToChannelDocument,
  deleteNewsListDocument,
  removeNewsFromChannelDocument,
} from '../news.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteNewsBulkAction = ({
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
      mutationDocument={deleteNewsListDocument}
      entityName="news"
      requiredPermissions={['DeleteNews']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignNewsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="news"
      mutationFn={api.mutate(assignNewsToChannelDocument)}
      requiredPermissions={['UpdateNews']}
      buildInput={(channelId: string) => ({
        newsIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveNewsFromChannelBulkAction = ({
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
      entityType="news"
      mutationFn={api.mutate(removeNewsFromChannelDocument)}
      requiredPermissions={['UpdateNews']}
      buildInput={() => ({
        newsIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
