import { useState } from 'react';
import { Button, AssetPickerDialog } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';

/** Image field with picker and preview. Stores ID and displays thumbnail/URL if available. */
export function ImageFieldWithPicker({
  value,
  onChange,
  placeholder = 'Asset ID or URL',
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const val = String(value ?? '');
  const isUrl = /^https?:\/\//i.test(val);

  return (
    <div className="flex flex-col gap-2">
      {val && isUrl ? (
        <div className="flex items-center gap-3">
          <img src={val} alt="preview" className="h-12 w-20 rounded border object-cover bg-muted" />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
              <Trans>Change</Trans>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onChange('');
              }}
            >
              <Trans>Clear</Trans>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={val}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border p-2"
          />
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <Trans>Pick</Trans>
          </Button>
        </div>
      )}

      {val && !isUrl && (
        <div className="text-[11px] opacity-60 break-all">
          ID: <code>{val}</code>
        </div>
      )}

      <AssetPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={assets => {
          const a = assets?.[0];
          if (!a) return;
          onChange(a.id); // we persist ID
          setOpen(false); // we always close after pick
        }}
        multiSelect={false}
        title="Select Asset"
      />
    </div>
  );
}
