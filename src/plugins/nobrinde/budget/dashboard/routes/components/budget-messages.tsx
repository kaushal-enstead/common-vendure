import { Button, Input, api, cn, useQuery, useMutation, useQueryClient } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import React, { useState, useRef, useEffect } from 'react';
import { graphql } from '@/gql';

// GraphQL documents
const getBudgetMessagesDocument = graphql(`
  query GetBudgetMessages($budgetId: ID!) {
    getBudgetMessages(budgetId: $budgetId) {
      id
      content
      sender
      senderId
      timestamp
      budgetId
    }
  }
`);

const addBudgetMessageDocument = graphql(`
  mutation AddBudgetMessage($budgetId: ID!, $content: String!) {
    addBudgetMessage(budgetId: $budgetId, content: $content) {
      id
      content
      sender
      senderId
      timestamp
      budgetId
    }
  }
`);

export function BudgetMessages({ budgetId }: { budgetId: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Query messages
  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgetMessages', budgetId],
    queryFn: () => api.query(getBudgetMessagesDocument, { budgetId: budgetId }),
    enabled: !!budgetId,
    refetchInterval: 15000, // auto-update like chat
  });

  // Send message mutation
  const mutation = useMutation({
    mutationFn: api.mutate(addBudgetMessageDocument),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetMessages', budgetId] });
      setContent('');
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.getBudgetMessages?.length ?? 0]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (content.trim().length > 0 && !mutation.isPending) {
      mutation.mutate({ budgetId, content: content.trim() });
    }
  };

  const messages = data?.getBudgetMessages ?? [];

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto bg-muted p-4 rounded border mb-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            <Trans>Loading messages...</Trans>
          </div>
        ) : isError ? (
          <div className="text-sm text-destructive">
            <Trans>Failed to load messages.</Trans>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <Trans>No messages yet</Trans>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map(msg => {
              const isMe = msg.sender === 'SELLER';
              const isCustomer = msg.sender === 'CUSTOMER';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex w-full',
                    isMe ? 'justify-end' : isCustomer ? 'justify-start' : 'justify-center',
                  )}
                >
                  <div
                    className={cn(
                      'px-3 py-2 rounded-lg max-w-xs break-words shadow',
                      isCustomer
                        ? 'bg-white text-slate-900 rounded-bl-none border'
                        : isMe
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-amber-50 text-amber-800 border border-amber-200',
                    )}
                    title={msg.timestamp && new Date(msg.timestamp).toLocaleString()}
                  >
                    <div className="break-words">{msg.content}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">
                      {msg.sender}{' '}
                      <span className="ml-1">
                        {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message…"
          disabled={mutation.isPending}
          autoComplete="off"
        />
        <Button onClick={handleSend} type="submit" disabled={mutation.isPending || !content.trim()}>
          <Trans>Send</Trans>
        </Button>
      </div>
    </div>
  );
}
