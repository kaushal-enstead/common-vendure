import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  api,
  useChannel,
} from '@vendure/dashboard';
import {
  assignCategoriesToChannelDocument,
  deleteCategoriesDocument,
  removeCategoriesFromChannelDocument,
} from '../category.graphql.js';
import { DeleteBulkAction } from '../../../shared/delete-bulk-action.js';

export const DeleteCategoriesBulkAction = ({
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
      mutationDocument={deleteCategoriesDocument}
      entityName="categories"
      requiredPermissions={['DeleteCategory']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
    />
  );
};

export const AssignCategoriesToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="category"
      mutationFn={api.mutate(assignCategoriesToChannelDocument)}
      requiredPermissions={['UpdateCategory']}
      buildInput={(channelId: string) => ({
        categoryIds: selection.map(s => s.id),
        channelId,
      })}
    />
  );
};

export const RemoveCategoriesFromChannelBulkAction = ({
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
      entityType="category"
      mutationFn={api.mutate(removeCategoriesFromChannelDocument)}
      requiredPermissions={['UpdateCategory']}
      buildInput={() => ({
        categoryIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};
