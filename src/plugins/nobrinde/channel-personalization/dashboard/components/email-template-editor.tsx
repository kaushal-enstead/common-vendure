import { Button, DashboardFormComponent, RichTextEditor } from '@vendure/dashboard';

const TEMPLATE_TOKENS = [
  '{{storeDisplayName}}',
  '{{storeAddress}}',
  '{{privacyPolicyUrl}}',
  '{{supportEmail}}',
];

export const EmailTemplateEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const textValue = typeof value === 'string' ? value : '';

  const insertToken = (token: string) => {
    const prefix = textValue && !textValue.endsWith('\n') ? '\n' : '';
    onChange(`${textValue}${prefix}${token}`);
  };

  return (
    <div className="space-y-2">
      <RichTextEditor
        value={textValue}
        onChange={content => onChange(content)}
        disabled={disabled}
        // rows={8}
        // placeholder="Write rich footer/header content. You can use HTML and helper tokens."
      />
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_TOKENS.map(token => (
          <Button
            key={token}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => insertToken(token)}
          >
            {token}
          </Button>
        ))}
      </div>
    </div>
  );
};
