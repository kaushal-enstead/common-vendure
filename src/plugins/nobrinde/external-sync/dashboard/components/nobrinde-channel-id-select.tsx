import {
  DashboardFormComponent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useQuery,
  useFormContext,
} from '@vendure/dashboard';
import { api } from '@vendure/dashboard';
import { availableNobrindeChannelsDocument } from '../graphql/available-nobrinde-channels.graphql';

type Option = { id: string; name: string; slug: string };

export const NobrindeChannelIdSelect: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const formContext = useFormContext?.();
  const currentChannelId = formContext?.getValues?.()?.['id'] ?? formContext?.watch?.('id') ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['available-nobrinde-channels-for-link', currentChannelId],
    queryFn: () =>
      api.query(availableNobrindeChannelsDocument, {
        currentChannelId: currentChannelId || null,
        options: { take: 500, skip: 0 },
      }),
  });

  const options: Option[] = data?.availableNobrindeChannels?.items ?? [];
  const currentValue = value ? String(value) : '';
  const NONE_VALUE = '__NONE__';

  return (
    <Select
      value={currentValue ? currentValue : NONE_VALUE}
      onValueChange={v => {
        if (!v) return;
        onChange(v === NONE_VALUE ? null : Number(v));
      }}
      disabled={disabled || isLoading || !data}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select Nobrinde channel (unlinked only)'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <span className="text-muted-foreground">— None —</span>
        </SelectItem>
        {options.map((nc: Option) => (
          <SelectItem key={nc.id} value={String(nc.id)}>
            {nc.name || nc.slug || `Channel #${nc.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
