import { TagIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  BulkActionComponent,
  AssignToChannelBulkAction,
  RemoveFromChannelBulkAction,
  usePriceFactor,
  api,
  useChannel,
  usePaginatedList,
  DataTableBulkActionItem,
} from '@vendure/dashboard';
import {
  assignKitsToChannelDocument,
  deleteKitsDocument,
  getKitsWithFacetValuesByIdsDocument,
  kitDetailDocument,
  removeKitsFromChannelDocument,
  updateKitsDocument,
} from '../kits.graphql.js';
import { Trans } from '@lingui/react/macro';
import { AssignFacetValuesDialog } from './assign-facet-values-dialog.js';
import { DeleteBulkAction } from './delete-bulk-action.js';

export const DeleteKitsBulkAction = ({
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
      mutationDocument={deleteKitsDocument}
      entityName="kit"
      requiredPermissions={['DeleteKit']}
      selection={selection}
      table={table}
      onSuccess={onSuccess}
      // invalidateQueries={['KitList', 'kits']}
    />
  );
};

export const AssignKitsToChannelBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  const { priceFactor, priceFactorField } = usePriceFactor();

  return (
    <AssignToChannelBulkAction
      selection={selection}
      table={table}
      entityType="kit"
      mutationFn={api.mutate(assignKitsToChannelDocument)}
      requiredPermissions={['UpdateKit']}
      buildInput={(channelId: string) => ({
        kitIds: selection.map(s => s.id),
        channelId,
        priceFactor,
      })}
      additionalFields={priceFactorField}
    />
  );
};

export const RemoveKitsFromChannelBulkAction = ({
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
      entityType="kit"
      mutationFn={api.mutate(removeKitsFromChannelDocument)}
      requiredPermissions={['UpdateKit']}
      buildInput={() => ({
        kitIds: selection.map(s => s.id),
        channelId: activeChannel?.id,
      })}
      onSuccess={onSuccess}
    />
  );
};

export const AssignFacetValuesToKitsBulkAction: BulkActionComponent<any> = ({ selection, table }) => {
  // const { refetchPaginatedList } = usePaginatedList();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    // refetchPaginatedList();
    table.resetRowSelection();
  };

  return (
    <>
      <DataTableBulkActionItem
        requiresPermission={['UpdateKit']}
        onClick={() => setDialogOpen(true)}
        label={<Trans>Edit facet values</Trans>}
        icon={TagIcon}
      />
      <AssignFacetValuesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityIds={selection.map(s => s.id)}
        entityType="kits"
        queryFn={variables => api.query(getKitsWithFacetValuesByIdsDocument, variables)}
        mutationFn={api.mutate(updateKitsDocument)}
        detailDocument={kitDetailDocument}
        onSuccess={handleSuccess}
      />
    </>
  );
};
