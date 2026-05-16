import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignDocumentsToChannelDocument,
  deleteDocumentsDocument,
  removeDocumentsFromChannelDocument,
} from '../document.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteDocumentsBulkAction = ({
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
      mutationDocument={deleteDocumentsDocument}
      entityName="document"
      requiredPermissions={['DeleteDocument']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignDocumentsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="document"
      mutationFn={api.mutate(assignDocumentsToChannelDocument)}
      requiredPermissions={['UpdateDocument']}
      buildInput={(channelId: string) => ({
        documentIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveDocumentsFromChannelBulkAction = ({
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
      entityType="document"
      mutationFn={api.mutate(removeDocumentsFromChannelDocument)}
      requiredPermissions={['UpdateDocument']}
      buildInput={() => ({
        documentIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
