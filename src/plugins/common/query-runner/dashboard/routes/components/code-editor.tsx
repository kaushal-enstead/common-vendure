import { useEffect, useRef } from 'react';
import { useLingui } from '@lingui/react/macro';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const { t } = useLingui();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full min-h-[200px] p-4 font-mono text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder={t`SELECT * FROM customer LIMIT 10;\n-- Or try: INSERT, UPDATE, DELETE, CREATE`}
      style={{
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
      }}
    />
  );
}
