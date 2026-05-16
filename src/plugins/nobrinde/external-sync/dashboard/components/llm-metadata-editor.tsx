import { Badge, Button, DashboardFormComponent, Input } from '@vendure/dashboard';
import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

type LlmMetadata = {
  keywords: string;
  useCases: string[];
};

const defaultLlm: LlmMetadata = {
  keywords: '',
  useCases: [],
};

export const LlmMetadataEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  let parsed: LlmMetadata = defaultLlm;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      parsed = { ...defaultLlm, ...(json ?? {}) };
    } catch {
      parsed = defaultLlm;
    }
  } else if (value && typeof value === 'object') {
    parsed = { ...defaultLlm, ...(value as any) };
  }

  const meta: LlmMetadata = parsed;

  const [useCaseInput, setUseCaseInput] = useState('');

  const handleChange = <K extends keyof LlmMetadata>(key: K, newValue: LlmMetadata[K]) => {
    const next: LlmMetadata = {
      ...meta,
      [key]: newValue,
    };
    onChange(JSON.stringify(next));
  };

  const addUseCase = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setUseCaseInput('');
      return;
    }
    if (!meta.useCases.includes(trimmed)) {
      handleChange('useCases', [...meta.useCases, trimmed]);
    }
    setUseCaseInput('');
  };

  const removeUseCase = (toRemove: string) => {
    handleChange(
      'useCases',
      meta.useCases.filter(uc => uc !== toRemove),
    );
  };

  const handleUseCaseKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addUseCase(useCaseInput);
    } else if (e.key === 'Backspace' && useCaseInput === '' && meta.useCases.length > 0) {
      removeUseCase(meta.useCases[meta.useCases.length - 1]);
    }
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
        <label className="block text-sm font-medium mb-1">Keywords</label>
        <Input
          value={meta.keywords}
          onChange={e => handleChange('keywords', e.target.value)}
          disabled={disabled}
          placeholder="Comma-separated keywords, e.g. eco, reusable, stainless steel"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Use cases</label>

        <div className="flex flex-wrap gap-1">
          {meta.useCases.map((uc, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {uc}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeUseCase(uc)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <Input
          value={useCaseInput}
          onChange={e => setUseCaseInput(e.target.value)}
          onKeyDown={handleUseCaseKeyDown}
          disabled={disabled}
          placeholder="Type a use case and press Enter or comma"
          name="llm_use_cases"
        />
      </div>
    </div>
  );
};
