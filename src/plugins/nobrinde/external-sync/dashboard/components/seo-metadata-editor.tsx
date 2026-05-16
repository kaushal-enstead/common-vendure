import { DashboardFormComponent, Input, Textarea } from '@vendure/dashboard';

type SeoMetadata = {
  title: string;
  description: string;
};

const defaultSeo: SeoMetadata = {
  title: '',
  description: '',
};

export const SeoMetadataEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  let parsed: SeoMetadata = defaultSeo;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      parsed = { ...defaultSeo, ...(json ?? {}) };
    } catch {
      parsed = defaultSeo;
    }
  } else if (value && typeof value === 'object') {
    parsed = { ...defaultSeo, ...(value as any) };
  }

  const meta: SeoMetadata = parsed;

  const handleChange = <K extends keyof SeoMetadata>(key: K, newValue: SeoMetadata[K]) => {
    const next: SeoMetadata = {
      ...meta,
      [key]: newValue,
    };
    onChange(JSON.stringify(next));
  };

  return (
    <div
      className="space-y-4"
      style={{
        // width: '200%',
        maxWidth: 'none',
        // marginLeft: '-50%',
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1">SEO title</label>
        <Input
          value={meta.title}
          onChange={e => handleChange('title', e.target.value)}
          disabled={disabled}
          placeholder="Title used in meta tags and search results"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">SEO description</label>
        <Textarea
          value={meta.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Short summary for search engines and social previews"
        />
      </div>
    </div>
  );
};
