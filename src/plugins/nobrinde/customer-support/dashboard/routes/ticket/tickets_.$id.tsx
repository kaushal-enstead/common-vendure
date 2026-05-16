import {
  api,
  NEW_ENTITY_PATH,
  Button,
  CustomFieldsPageBlock,
  DashboardRouteDefinition,
  detailPageRouteLoader,
  FormFieldWrapper,
  Input,
  LabeledData,
  MultiSelect,
  Page,
  PageActionBar,
  ActionBarItem,
  PageBlock,
  PageLayout,
  PageTitle,
  ScrollArea,
  useDetailPage,
  useNavigate,
  toast,
  useMutation,
} from '@vendure/dashboard';
import { Send } from 'lucide-react';
import {
  addSupportTicketMessageDocument,
  supportTicketDetailDocument,
  updateSupportTicketDocument,
} from './tickets.graphql';
import { useEffect, useState } from 'react';
import ChatItem from './components/chat-item';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import { Trans, useLingui } from '@lingui/react/macro';

const pageId = 'ticket-detail';

export const supportTicketDetail: DashboardRouteDefinition = {
  path: '/support-tickets/$id',
  loader: detailPageRouteLoader({
    queryDocument: supportTicketDetailDocument,
    breadcrumb: (isNew, entity) => [
      { path: '/support-tickets', label: 'Tickets' },
      isNew ? 'New ticket' : entity?.id,
    ],
  }),
  component: route => {
    const params = route.useParams();
    const navigate = useNavigate();
    const creatingNewEntity = params.id === NEW_ENTITY_PATH;
    const { i18n } = useLingui();
    const [newMessage, setNewMessage] = useState('');
    const { ref: messagesEndRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>();

    const { form, submitHandler, entity, refreshEntity, isPending, resetForm } = useDetailPage({
      pageId,
      queryDocument: supportTicketDetailDocument,
      // createDocument: createSupportTicketDocument,
      updateDocument: updateSupportTicketDocument,
      setValuesForUpdate: ticket => {
        return {
          id: ticket?.id ?? '',
          customer: [ticket?.customer?.firstName, ticket?.customer?.lastName].filter(Boolean).join(' ') || '',
          subject: ticket?.subject?.name ?? '',
          description: ticket?.description ?? '',
          status: ticket?.status ?? 'OPEN',
          priority: ticket?.priority ?? 'LOW',
          messages: ticket?.messages ?? [],
        };
      },
      transformCreateInput: values => {
        return {
          ...values,
        };
      },
      params: { id: params.id },
      onSuccess: async data => {
        toast(i18n.t(creatingNewEntity ? 'Successfully created ticket' : 'Successfully updated ticket'));
        resetForm();
        if (creatingNewEntity) {
          await navigate({ to: `../$id`, params: { id: data.id } as any });
        }
      },
      onError: err => {
        toast(i18n.t(creatingNewEntity ? 'Failed to create ticket' : 'Failed to update ticket'), {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      },
    });

    const { mutate: sendSupportChatMessage, isPending: isSendingSupportChatMessage } = useMutation({
      mutationFn: api.mutate(addSupportTicketMessageDocument),
      onSuccess: () => {
        toast(i18n.t('Message added successfully'));
        refreshEntity();
        setNewMessage('');
      },
      onError: () => {
        toast(i18n.t('Failed to add message'));
      },
    });

    const handleSendSupportChatMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!entity?.id) return;
      sendSupportChatMessage({ input: { supportTicketId: entity?.id, content: newMessage } });
    };

    useEffect(() => {
      scrollToBottom();
    }, [entity]);

    return (
      <Page pageId={pageId} form={form} submitHandler={submitHandler} entity={entity}>
        <PageTitle>{creatingNewEntity ? <Trans>New ticket</Trans> : (entity?.id ?? '')}</PageTitle>
        <PageActionBar>
          <ActionBarItem itemId="save-button" requiresPermission={['UpdateSupportTicket']}>
            <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid || isPending}>
              {creatingNewEntity ? <Trans>Create</Trans> : <Trans>Update</Trans>}
            </Button>
          </ActionBarItem>
        </PageActionBar>
        <PageLayout>
          <PageBlock column="side" blockId="active-status">
            <div className="flex flex-col gap-4">
              <FormFieldWrapper
                control={form.control}
                name="status"
                label={<Trans>Status</Trans>}
                // description={<Trans>Status of the ticket</Trans>}
                // renderFormControl={false}
                render={({ field }) => (
                  <MultiSelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    multiple={false}
                    items={[
                      { label: i18n.t('Open'), value: 'OPEN' },
                      { label: i18n.t('Closed'), value: 'CLOSED' },
                      { label: i18n.t('Pending'), value: 'PENDING' },
                    ]}
                    placeholder={i18n.t('Select a status')}
                    searchPlaceholder={i18n.t('Search status...')}
                  />
                  // <Select onValueChange={field.onChange} defaultValue={entity?.status} value={field.value}>
                  //   <SelectTrigger className="w-full">
                  //     <SelectValue>{field.value}</SelectValue>
                  //   </SelectTrigger>
                  //   <SelectContent>
                  //     {[
                  //       { label: 'Open', value: 'OPEN' },
                  //       { label: 'Closed', value: 'CLOSED' },
                  //       { label: 'Pending', value: 'PENDING' },
                  //     ].map(status => (
                  //       <SelectItem key={status.value} value={status.value}>
                  //         <Trans>{status.label}</Trans>
                  //       </SelectItem>
                  //     ))}
                  //   </SelectContent>
                  // </Select>
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="priority"
                label={<Trans>Priority</Trans>}
                // description={<Trans>Priority of the ticket</Trans>}
                renderFormControl={false}
                render={({ field }) => (
                  <MultiSelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    multiple={false}
                    items={[
                      { label: i18n.t('Low'), value: 'LOW' },
                      { label: i18n.t('Medium'), value: 'MEDIUM' },
                      { label: i18n.t('High'), value: 'HIGH' },
                      { label: i18n.t('Urgent'), value: 'URGENT' },
                    ]}
                    placeholder={i18n.t('Select a priority')}
                    searchPlaceholder={i18n.t('Search priority...')}
                  />
                )}
              />
            </div>
          </PageBlock>
          <PageBlock column="main" blockId="main-form">
            <div className="grid grid-cols-3 gap-4 divide-x divide-foreground/10">
              <LabeledData
                label={<Trans>Customer</Trans>}
                value={entity?.customer?.firstName + ' ' + entity?.customer?.lastName}
              />
              <LabeledData label={<Trans>Subject</Trans>} value={entity?.subject?.name} />
              <LabeledData label={<Trans>Seller</Trans>} value={entity?.channel?.seller?.name} />
            </div>
            <hr className="my-4" />
            <LabeledData label={<Trans>Description</Trans>} value={entity?.description} />
          </PageBlock>

          <PageBlock column="main" blockId="messages">
            <span className="text-base py-2 text-muted-foreground">
              <Trans>Discussions</Trans> ({entity?.messages?.length})
            </span>

            <ScrollArea className="h-[19rem] border border-border rounded-md bg-sidebar mb-4 scrollbar-thin">
              <div className="flex flex-col space-y-6 py-6 px-5">
                {entity?.messages?.map(msg => (
                  <div key={msg.id}>
                    <ChatItem key={msg.id} msg={msg} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* <div className="flex flex-col h-[300px] border border-border rounded-md bg-sidebar p-4 overflow-y-auto mb-4">
              {entity?.messages?.length ? (
                entity.messages.map(msg => <ChatItem key={msg.id} msg={msg} />)
              ) : (
                <div className="text-muted-foreground text-center flex flex-col items-center justify-center gap-2 my-8">
                  <Archive className="size-12" />
                  <Trans>No messages yet.</Trans>
                </div>
              )}
            </div> */}

            <div className="flex gap-4">
              <Input
                placeholder={i18n.t('Type your message...')}
                autoComplete="off"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <Button
                disabled={!newMessage || isSendingSupportChatMessage}
                onClick={handleSendSupportChatMessage}
                // type="button"
                // className={cn(
                //   'inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
                //   'hover:bg-primary/90 transition',
                //   'disabled:opacity-50 disabled:cursor-not-allowed',
                // )}
              >
                <Send />
                <Trans>Send</Trans>
              </Button>
            </div>
          </PageBlock>

          <CustomFieldsPageBlock column="main" entityType="SupportTicket" control={form.control} />
        </PageLayout>
      </Page>
    );
  },
};
