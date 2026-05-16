import { DashboardFormComponent, Input } from '@vendure/dashboard';

type GlobalMetadata = {
  google_id: string;
  wiki_id: string;
  sameAs: string;
};

const defaultMeta: GlobalMetadata = {
  google_id: '',
  wiki_id: '',
  sameAs: '',
};

function parseValue(value: unknown): GlobalMetadata {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return { ...defaultMeta, ...(json ?? {}) };
    } catch {
      return defaultMeta;
    }
  }
  if (value && typeof value === 'object') {
    return { ...defaultMeta, ...(value as any) };
  }
  return defaultMeta;
}

export const GlobalMetadataEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const meta = parseValue(value);

  const handleChange = <K extends keyof GlobalMetadata>(key: K, newValue: string) => {
    onChange(JSON.stringify({ ...meta, [key]: newValue }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Google ID</label>
        <Input
          value={meta.google_id}
          onChange={e => handleChange('google_id', e.target.value)}
          disabled={disabled}
          placeholder="e.g. 166"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Wikidata ID</label>
        <Input
          value={meta.wiki_id}
          onChange={e => handleChange('wiki_id', e.target.value)}
          disabled={disabled}
          placeholder="e.g. Q1027726"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">sameAs URL</label>
        <Input
          value={meta.sameAs}
          onChange={e => handleChange('sameAs', e.target.value)}
          disabled={disabled}
          placeholder="e.g. https://en.wikipedia.org/wiki/Scarf"
        />
      </div>
    </div>
  );
};
