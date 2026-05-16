import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Input,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';

interface CssEditorModalProps {
  open: boolean;
  onClose: () => void;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  title?: React.ReactNode;
  defaultFields?: Array<{ key: string; label: string; placeholder?: string }>;
  jsonMode?: boolean; // If true, shows JSON editor; if false, shows form fields
}

export function CssEditorModal({
  open,
  onClose,
  value,
  onChange,
  title = <Trans>Edit CSS</Trans>,
  defaultFields = [],
  jsonMode = true,
}: CssEditorModalProps) {
  const [jsonValue, setJsonValue] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const previousOpenRef = useRef(false);
  const initialValueRef = useRef<Record<string, any>>({});
  // Default to form mode if defaultFields are provided, otherwise JSON mode
  // TODO: Re-enable form mode toggle when needed
  const [mode, setMode] = useState<'json' | 'form'>('json'); // Always JSON mode for now

  useEffect(() => {
    // Only initialize when modal opens (transition from closed to open)
    if (open && !previousOpenRef.current) {
      initialValueRef.current = JSON.parse(JSON.stringify(value || {})); // Deep clone to avoid reference issues
      // Always use JSON mode for now
      setJsonValue(JSON.stringify(initialValueRef.current, null, 2));
      setError(null);
    }
    previousOpenRef.current = open;
  }, [open]); // Only depend on 'open' to prevent infinite loops

  // TODO: Re-enable mode switching when needed
  // Update when mode changes while modal is open
  // useEffect(() => {
  //   if (open && previousOpenRef.current && defaultFields.length > 0) {
  //     // Only sync if we have default fields and modal was already open
  //     if (mode === 'json') {
  //       // When switching to JSON, use current form values merged with initial value
  //       const currentValue = { ...initialValueRef.current };
  //       Object.keys(formValues).forEach(key => {
  //         if (formValues[key]) {
  //           currentValue[key] = formValues[key];
  //         } else {
  //           delete currentValue[key];
  //         }
  //       });
  //       setJsonValue(JSON.stringify(currentValue, null, 2));
  //     } else if (mode === 'form') {
  //       // When switching to form, parse JSON and extract default fields
  //       try {
  //         const parsed = JSON.parse(jsonValue);
  //         const initialValues: Record<string, string> = {};
  //         defaultFields.forEach(field => {
  //           initialValues[field.key] = (parsed[field.key] as string) || '';
  //         });
  //         setFormValues(initialValues);
  //       } catch {
  //         // If JSON is invalid, use initial values
  //         const initialValues: Record<string, string> = {};
  //         defaultFields.forEach(field => {
  //           initialValues[field.key] = (initialValueRef.current[field.key] as string) || '';
  //         });
  //         setFormValues(initialValues);
  //       }
  //     }
  //   }
  // }, [mode]); // Only update when mode changes, removed 'open' to prevent issues

  const handleSave = () => {
    try {
      // Always use JSON mode for now
      const parsed = JSON.parse(jsonValue);
      onChange(parsed);
      setError(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* TODO: Re-enable mode toggle when needed
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'json' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('json')}
            >
              <Trans>JSON Mode</Trans>
            </Button>
            <Button
              type="button"
              variant={mode === 'form' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('form')}
            >
              <Trans>Form Mode</Trans>
            </Button>
          </div>
          */}

          {/* Always show JSON mode for now */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              <Trans>CSS Properties (JSON)</Trans>
            </label>
            <Textarea
              value={jsonValue}
              onChange={e => {
                setJsonValue(e.target.value);
                setError(null);
              }}
              className="font-mono text-sm min-h-[300px]"
              placeholder='{\n  "backgroundColor": "#ffffff",\n  "color": "#000000",\n  "padding": "20px"\n}'
            />
            {error && (
              <p className="text-sm text-red-500 mt-2">
                <Trans>Error: {error}</Trans>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              <Trans>
                Enter CSS properties as JSON. Example: {'{'} "backgroundColor": "#ffffff" {'}'}
              </Trans>
            </p>
          </div>
          {/* TODO: Re-enable form mode when needed
          {mode === 'json' ? (
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Trans>CSS Properties (JSON)</Trans>
              </label>
              <Textarea
                value={jsonValue}
                onChange={e => {
                  setJsonValue(e.target.value);
                  setError(null);
                }}
                className="font-mono text-sm min-h-[300px]"
                placeholder='{\n  "backgroundColor": "#ffffff",\n  "color": "#000000",\n  "padding": "20px"\n}'
              />
              {error && (
                <p className="text-sm text-red-500 mt-2">
                  <Trans>Error: {error}</Trans>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <Trans>
                  Enter CSS properties as JSON. Example: {'{'} "backgroundColor": "#ffffff" {'}'}
                </Trans>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {defaultFields.map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium mb-2 block">{field.label}</label>
                  <Input
                    value={formValues[field.key] || ''}
                    onChange={e => {
                      setFormValues(prev => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }));
                    }}
                    placeholder={field.placeholder || ''}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                <Trans>Switch to JSON mode to add more CSS properties</Trans>
              </p>
            </div>
          )}
          */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button onClick={handleSave} disabled={!!error}>
            <Trans>Save</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
