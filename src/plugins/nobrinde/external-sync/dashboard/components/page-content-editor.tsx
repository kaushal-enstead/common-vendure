import { DashboardFormComponent, Input, Textarea } from '@vendure/dashboard';

type PageContent = {
  title: string;
  intro: string;
  desc: string;
};

const defaultContent: PageContent = {
  title: '',
  intro: '',
  desc: '',
};

function parseValue(value: unknown): PageContent {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return { ...defaultContent, ...(json ?? {}) };
    } catch {
      return defaultContent;
    }
  }
  if (value && typeof value === 'object') {
    return { ...defaultContent, ...(value as any) };
  }
  return defaultContent;
}

export const PageContentEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const content = parseValue(value);

  const handleChange = <K extends keyof PageContent>(key: K, newValue: string) => {
    onChange(JSON.stringify({ ...content, [key]: newValue }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={content.title}
          onChange={e => handleChange('title', e.target.value)}
          disabled={disabled}
          placeholder="Page title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Intro</label>
        <Textarea
          value={content.intro}
          onChange={e => handleChange('intro', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Short introductory paragraph"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={content.desc}
          onChange={e => handleChange('desc', e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder="Full page description"
        />
      </div>
    </div>
  );
};
