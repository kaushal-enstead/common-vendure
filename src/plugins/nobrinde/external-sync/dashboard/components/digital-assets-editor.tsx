import { Button, DashboardFormComponent, Input, Switch } from '@vendure/dashboard';
import { Plus, Trash2 } from 'lucide-react';

type DigitalAsset = {
  url: string;
  is_confidencial: boolean;
  type: string;
  subtype: string;
};

type FormValue = DigitalAsset[];

const defaultAsset: DigitalAsset = {
  url: '',
  is_confidencial: false,
  type: 'document',
  subtype: '',
};

export const DigitalAssetsEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const assets: FormValue = Array.isArray(value) ? value : [];

  const updateAsset = (index: number, patch: Partial<DigitalAsset>) => {
    const next = [...assets];
    next[index] = { ...(next[index] ?? defaultAsset), ...patch };
    onChange(next);
  };

  const addAsset = () => {
    onChange([...assets, defaultAsset]);
  };

  const removeAsset = (index: number) => {
    const next = assets.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div
      className="space-y-4"
      style={{
        width: '200%',
        maxWidth: 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold"></h3>
        <Button type="button" variant="outline" size="sm" onClick={addAsset} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add asset
        </Button>
      </div>

      {assets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No digital assets. Click &quot;Add asset&quot; to link certificates or other documents.
        </p>
      )}

      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Asset #{index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAsset(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input
                  value={asset.url}
                  onChange={e => updateAsset(index, { url: e.target.value })}
                  disabled={disabled}
                  placeholder="https://cdn.nobrinde.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Input
                  value={asset.type}
                  onChange={e => updateAsset(index, { type: e.target.value })}
                  disabled={disabled}
                  placeholder="document, image, video..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Is confidential</label>
                <Switch
                  checked={!!asset.is_confidencial}
                  onCheckedChange={val => updateAsset(index, { is_confidencial: !!val })}
                  disabled={disabled}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Subtype / description</label>
                <Input
                  value={asset.subtype}
                  onChange={e => updateAsset(index, { subtype: e.target.value })}
                  disabled={disabled}
                  placeholder="pt: ..., es: ..., en: ..., fr: ..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
