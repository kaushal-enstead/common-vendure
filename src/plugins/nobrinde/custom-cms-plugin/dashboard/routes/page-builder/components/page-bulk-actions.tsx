import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignPagesToChannelDocument,
  deletePageListDocument,
  removePagesFromChannelDocument,
} from '../page.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeletePagesBulkAction = ({
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
      mutationDocument={deletePageListDocument}
      entityName="pages"
      requiredPermissions={['DeletePage']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignPagesToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="page"
      mutationFn={api.mutate(assignPagesToChannelDocument)}
      requiredPermissions={['UpdatePage']}
      buildInput={(channelId: string) => ({
        pageIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemovePagesFromChannelBulkAction = ({
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
      entityType="page"
      mutationFn={api.mutate(removePagesFromChannelDocument)}
      requiredPermissions={['UpdatePage']}
      buildInput={() => ({
        pageIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
