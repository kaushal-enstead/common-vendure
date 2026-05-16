import { Button } from '@vendure/dashboard';
import type { ComponentProps, ReactNode } from 'react';

export type ConfirmedSyncButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  onConfirmed: () => void;
  confirmMessage: string;
  children: ReactNode;
};

export function ConfirmedSyncButton({
  onConfirmed,
  confirmMessage,
  children,
  disabled,
  ...rest
}: ConfirmedSyncButtonProps) {
  return (
    <Button
      {...rest}
      type="button"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          onConfirmed();
        }
      }}
    >
      {children}
    </Button>
  );
}
