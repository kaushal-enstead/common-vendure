import { cn } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';

interface ChatItemProps {
  msg: {
    content: string;
    id: string;
    sender: 'CUSTOMER' | 'SELLER';
    senderId: string;
    timestamp: string;
  };
}

const ChatItem = ({ msg }: ChatItemProps) => {
  return (
    <div
      key={msg.id}
      className={cn('flex mb-2', msg.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'relative max-w-xs md:max-w-md px-4 py-2 rounded-2xl',
          'whitespace-pre-line break-words text-foreground border border-border',
          msg.sender === 'CUSTOMER' ? 'bg-chart-4/20' : 'bg-chart-1/20',
        )}
        style={{
          borderTopLeftRadius: msg.sender === 'CUSTOMER' ? 0 : undefined,
          borderTopRightRadius: msg.sender === 'SELLER' ? 0 : undefined,
        }}
      >
        <div className="text-xs opacity-60 mb-1 flex items-center gap-2">
          <span>{msg.sender === 'CUSTOMER' ? <Trans>Customer</Trans> : <Trans>Seller</Trans>}</span>
          <span>·</span>
          <span>
            {msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
        <div className="text-sm">{msg.content}</div>
      </div>
    </div>
  );
};

export default ChatItem;
