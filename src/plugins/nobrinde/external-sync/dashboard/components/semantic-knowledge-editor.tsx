import { Badge, Button, DashboardFormComponent, Input } from '@vendure/dashboard';
import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

type SemanticKnowledge = {
  keywords: string[];
  synonyms: string[];
  audience: string[];
  use_cases: string[];
};

const defaultKnowledge: SemanticKnowledge = {
  keywords: [],
  synonyms: [],
  audience: [],
  use_cases: [],
};

function parseValue(value: unknown): SemanticKnowledge {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return { ...defaultKnowledge, ...(json ?? {}) };
    } catch {
      return defaultKnowledge;
    }
  }
  if (value && typeof value === 'object') {
    return { ...defaultKnowledge, ...(value as any) };
  }
  return defaultKnowledge;
}

type ArrayField = keyof SemanticKnowledge;

interface TagFieldProps {
  label: string;
  field: ArrayField;
  items: string[];
  disabled?: boolean;
  onChange: (field: ArrayField, items: string[]) => void;
}

function TagField({ label, field, items, disabled, onChange }: TagFieldProps) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInput('');
      return;
    }
    if (!items.includes(trimmed)) {
      onChange(field, [...items, trimmed]);
    }
    setInput('');
  };

  const remove = (item: string) => {
    onChange(field, items.filter(i => i !== item));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && input === '' && items.length > 0) {
      remove(items[items.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {item}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => remove(item)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type and press Enter or comma to add"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => add(input)}
          disabled={disabled || !input.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const SemanticKnowledgeEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const knowledge = parseValue(value);

  const handleFieldChange = (field: ArrayField, items: string[]) => {
    onChange(JSON.stringify({ ...knowledge, [field]: items }));
  };

  return (
    <div className="space-y-5">
      <TagField
        label="Keywords"
        field="keywords"
        items={knowledge.keywords}
        disabled={disabled}
        onChange={handleFieldChange}
      />
      <TagField
        label="Synonyms"
        field="synonyms"
        items={knowledge.synonyms}
        disabled={disabled}
        onChange={handleFieldChange}
      />
      <TagField
        label="Audience"
        field="audience"
        items={knowledge.audience}
        disabled={disabled}
        onChange={handleFieldChange}
      />
      <TagField
        label="Use Cases"
        field="use_cases"
        items={knowledge.use_cases}
        disabled={disabled}
        onChange={handleFieldChange}
      />
    </div>
  );
};
