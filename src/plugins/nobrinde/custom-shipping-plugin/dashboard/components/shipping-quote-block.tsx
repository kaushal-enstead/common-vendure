import {
  api,
  Button,
  Switch,
  cn,
  useQuery,
  useMutation,
  useQueryClient,
  toast,
  MoneyInput,
} from '@vendure/dashboard';
import { useState } from 'react';

const QUOTE_STATE_QUERY = `
  query CustomShippingQuoteState($orderId: ID!) {
    customShippingQuoteState(orderId: $orderId) {
      orderId
      status
      destination
      shippingAmountWithTax
      currencyCode
    }
  }
`;

const SET_QUOTE_MUTATION = `
  mutation CustomSetShippingQuote($input: CustomSetShippingQuoteInput!) {
    customSetShippingQuote(input: $input) {
      id
      code
    }
  }
`;

type QuoteState = {
  orderId: string;
  status: 'NOT_REQUIRED' | 'PENDING' | 'READY';
  destination: string | null;
  shippingAmountWithTax: number | null;
  currencyCode: string;
};

const STATUS_CONFIG = {
  NOT_REQUIRED: { label: 'Standard Shipping', className: 'bg-muted text-muted-foreground' },
  PENDING: {
    label: 'Pending Quote',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  READY: {
    label: 'Quote Ready',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
} as const;

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
}

interface Props {
  context: { entity?: { id?: string } };
}

export function ShippingQuoteBlock({ context }: Props) {
  const orderId = context.entity?.id;
  const queryClient = useQueryClient();

  const [amountEur, setAmountEur] = useState('');
  const [notify, setNotify] = useState(true);
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customShippingQuoteState', orderId],
    queryFn: () => api.query<{ customShippingQuoteState: QuoteState }>(QUOTE_STATE_QUERY, { orderId }),
    enabled: !!orderId,
  });

  const { mutate: setQuote, isPending } = useMutation({
    mutationFn: (input: { orderId: string; shippingAmountWithTax: number; notifyCustomer: boolean }) =>
      api.mutate(SET_QUOTE_MUTATION, { input }),
    onSuccess: () => {
      toast.success('Shipping quote set');
      queryClient.invalidateQueries({ queryKey: ['customShippingQuoteState', orderId] });
      setEditing(false);
      setAmountEur('');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to set shipping quote');
    },
  });

  if (!orderId || isLoading) return null;

  const state = data?.customShippingQuoteState;
  if (!state) return null;

  const statusConfig = STATUS_CONFIG[state.status];
  const isReady = state.status === 'READY';
  const showForm = state.status === 'PENDING' || editing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(amountEur)) {
      toast.error('Enter a valid amount in EUR');
      return;
    }
    setQuote({
      orderId,
      shippingAmountWithTax: Math.round(Number(amountEur)),
      notifyCustomer: notify,
    });
  };

  return (
    <div className="">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-semibold">Shipping Quote</h3>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusConfig.className,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Destination */}
      {state.destination && (
        <div className="text-xs text-muted-foreground flex items-center justify-between mb-4">
          <span>Destination:</span> <span className="font-medium text-foreground">{state.destination}</span>
        </div>
      )}

      {/* Not a quote zone — show info only */}
      {state.status === 'NOT_REQUIRED' && (
        <p className="text-xs text-muted-foreground">
          This zone uses standard shipping rates. No manual quote is required.
        </p>
      )}

      {/* Current quoted amount (when READY and not editing) */}
      {isReady && !editing && state.shippingAmountWithTax != null && (
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Quote amount</span>
          <span className="text-sm font-semibold">
            {formatAmount(state.shippingAmountWithTax, state.currencyCode)}
          </span>
        </div>
      )}

      {/* Form: shown when PENDING or admin clicks "Update quote" */}
      {showForm && (
        <form className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Quote amount (EUR)</label>
            <MoneyInput
              name={`amountEur`}
              value={amountEur}
              onChange={val => setAmountEur(val)}
              onBlur={() => {}}
              ref={() => {}}
              // disabled={disabled}
            />
            {/* <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountEur}
                onChange={e => setAmountEur(e.target.value)}
                className="w-full rounded-md border bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div> */}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={notify} onCheckedChange={setNotify} id="notify-customer" />
            <label htmlFor="notify-customer" className="cursor-pointer text-xs text-muted-foreground">
              Notify customer by email
            </label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button onClick={handleSubmit} size="sm" className="basis-1/2" disabled={isPending}>
              {isPending ? 'Saving…' : 'Set quote'}
            </Button>
            {isReady && (
              <Button
                type="button"
                className="basis-1/2"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setAmountEur('');
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {/* Update link when READY and not currently editing */}
      {isReady && !editing && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-6"
          // className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            setEditing(true);
            if (state.shippingAmountWithTax != null) {
              setAmountEur((state.shippingAmountWithTax / 100).toFixed(2));
            }
          }}
        >
          Update quote
        </Button>
      )}
    </div>
  );
}
