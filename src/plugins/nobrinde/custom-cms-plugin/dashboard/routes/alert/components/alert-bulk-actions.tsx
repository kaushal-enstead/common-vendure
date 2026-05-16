import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignAlertsToChannelDocument,
  deleteAlertsDocument,
  removeAlertsFromChannelDocument,
} from '../alert.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteAlertsBulkAction = ({
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
      mutationDocument={deleteAlertsDocument}
      entityName="alert"
      requiredPermissions={['DeleteAlert']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignAlertsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="alert"
      mutationFn={api.mutate(assignAlertsToChannelDocument)}
      requiredPermissions={['UpdateAlert']}
      buildInput={(channelId: string) => ({
        alertIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveAlertsFromChannelBulkAction = ({
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
      entityType="alert"
      mutationFn={api.mutate(removeAlertsFromChannelDocument)}
      requiredPermissions={['UpdateAlert']}
      buildInput={() => ({
        alertIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
