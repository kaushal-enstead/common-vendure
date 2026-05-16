import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignAuthorsToChannelDocument,
  deleteAuthorsDocument,
  removeAuthorsFromChannelDocument,
} from '../author.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteAuthorsBulkAction = ({
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
      mutationDocument={deleteAuthorsDocument}
      entityName="author"
      requiredPermissions={['DeleteAuthor']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignAuthorsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="author"
      mutationFn={api.mutate(assignAuthorsToChannelDocument)}
      requiredPermissions={['UpdateAuthor']}
      buildInput={(channelId: string) => ({
        authorIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveAuthorsFromChannelBulkAction = ({
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
      entityType="author"
      mutationFn={api.mutate(removeAuthorsFromChannelDocument)}
      requiredPermissions={['UpdateAuthor']}
      buildInput={() => ({
        authorIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
