import { DashboardFormComponent, Input, Textarea } from '@vendure/dashboard';

type SeoMeta = {
  m_title: string;
  m_desc: string;
};

const defaultSeo: SeoMeta = {
  m_title: '',
  m_desc: '',
};

function parseValue(value: unknown): SeoMeta {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return { ...defaultSeo, ...(json ?? {}) };
    } catch {
      return defaultSeo;
    }
  }
  if (value && typeof value === 'object') {
    return { ...defaultSeo, ...(value as any) };
  }
  return defaultSeo;
}

export const CollectionSeoEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const meta = parseValue(value);

  const handleChange = <K extends keyof SeoMeta>(key: K, newValue: string) => {
    onChange(JSON.stringify({ ...meta, [key]: newValue }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Meta Title</label>
        <Input
          value={meta.m_title}
          onChange={e => handleChange('m_title', e.target.value)}
          disabled={disabled}
          placeholder="Title used in meta tags and search results"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Meta Description</label>
        <Textarea
          value={meta.m_desc}
          onChange={e => handleChange('m_desc', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Short summary for search engines and social previews"
        />
      </div>
    </div>
  );
};
