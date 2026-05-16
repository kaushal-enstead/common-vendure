import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignFaqsToChannelDocument,
  deleteFaqsDocument,
  removeFaqsFromChannelDocument,
} from '../faq.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteFaqsBulkAction = ({
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
      mutationDocument={deleteFaqsDocument}
      entityName="faq"
      requiredPermissions={['DeleteFaq']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignFaqsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="faqCategory"
      mutationFn={api.mutate(assignFaqsToChannelDocument)}
      requiredPermissions={['UpdateFaq']}
      buildInput={(channelId: string) => ({
        faqIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveFaqsFromChannelBulkAction = ({
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
      entityType="faq"
      mutationFn={api.mutate(removeFaqsFromChannelDocument)}
      requiredPermissions={['UpdateFaq']}
      buildInput={() => ({
        faqIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
