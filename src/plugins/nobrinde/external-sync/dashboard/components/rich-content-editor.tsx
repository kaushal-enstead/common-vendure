import { Badge, Button, DashboardFormComponent, Input, Textarea } from '@vendure/dashboard';
import { useState, KeyboardEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

type CompTable = {
  headers: string[];
  rows: string[][];
};

type ProsCons = {
  pros: string[];
  cons: string[];
};

type RichContent = {
  takeaways: string[];
  guide: string;
  pros_cons: ProsCons;
  comp_table: CompTable;
  related: string[];
};

const defaultRichContent: RichContent = {
  takeaways: [],
  guide: '',
  pros_cons: { pros: [], cons: [] },
  comp_table: { headers: [], rows: [] },
  related: [],
};

function parseValue(value: unknown): RichContent {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return {
        ...defaultRichContent,
        ...(json ?? {}),
        pros_cons: { ...defaultRichContent.pros_cons, ...(json?.pros_cons ?? {}) },
        comp_table: {
          headers: Array.isArray(json?.comp_table?.headers) ? json.comp_table.headers : [],
          rows: Array.isArray(json?.comp_table?.rows) ? json.comp_table.rows : [],
        },
      };
    } catch {
      return defaultRichContent;
    }
  }
  if (value && typeof value === 'object') {
    const v = value as any;
    return {
      ...defaultRichContent,
      ...v,
      pros_cons: { ...defaultRichContent.pros_cons, ...(v.pros_cons ?? {}) },
      comp_table: {
        headers: Array.isArray(v?.comp_table?.headers) ? v.comp_table.headers : [],
        rows: Array.isArray(v?.comp_table?.rows) ? v.comp_table.rows : [],
      },
    };
  }
  return defaultRichContent;
}

// ── Simple tag-list input ──────────────────────────────────────────────────────
interface TagListProps {
  label: string;
  items: string[];
  disabled?: boolean;
  onChange: (items: string[]) => void;
  placeholder?: string;
}

function TagList({ label, items, disabled, onChange, placeholder }: TagListProps) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInput('');
      return;
    }
    onChange([...items, trimmed]);
    setInput('');
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && input === '' && items.length > 0) {
      remove(items.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground text-sm mt-0.5 min-w-[1rem]">{i + 1}.</span>
            <span className="flex-1 text-sm">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 shrink-0"
              onClick={() => remove(i)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? 'Type and press Enter to add'}
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

// ── Comparison table editor ────────────────────────────────────────────────────
interface CompTableEditorProps {
  table: CompTable;
  disabled?: boolean;
  onChange: (table: CompTable) => void;
}

function CompTableEditor({ table, disabled, onChange }: CompTableEditorProps) {
  const [newHeader, setNewHeader] = useState('');

  const addColumn = () => {
    const trimmed = newHeader.trim();
    if (!trimmed) return;
    const headers = [...table.headers, trimmed];
    const rows = table.rows.map(row => [...row, '']);
    onChange({ headers, rows });
    setNewHeader('');
  };

  const removeColumn = (colIndex: number) => {
    const headers = table.headers.filter((_, i) => i !== colIndex);
    const rows = table.rows.map(row => row.filter((_, i) => i !== colIndex));
    onChange({ headers, rows });
  };

  const addRow = () => {
    const newRow = table.headers.map(() => '');
    onChange({ ...table, rows: [...table.rows, newRow] });
  };

  const removeRow = (rowIndex: number) => {
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== rowIndex) });
  };

  const updateCell = (rowIndex: number, colIndex: number, cellValue: string) => {
    const rows = table.rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? cellValue : cell)) : row,
    );
    onChange({ ...table, rows });
  };

  const updateHeader = (colIndex: number, headerValue: string) => {
    const headers = table.headers.map((h, i) => (i === colIndex ? headerValue : h));
    onChange({ ...table, headers });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Comparison Table</label>

      {/* Add column */}
      <div className="flex gap-2">
        <Input
          value={newHeader}
          onChange={e => setNewHeader(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addColumn();
            }
          }}
          disabled={disabled}
          placeholder="New column header"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addColumn}
          disabled={disabled || !newHeader.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {table.headers.length > 0 && (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {table.headers.map((header, ci) => (
                  <th key={ci} className="p-2 text-left font-medium min-w-[120px]">
                    <div className="flex items-center gap-1">
                      <Input
                        value={header}
                        onChange={e => updateHeader(ci, e.target.value)}
                        disabled={disabled}
                        className="h-7 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => removeColumn(ci)}
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2">
                      <Input
                        value={cell}
                        onChange={e => updateCell(ri, ci, e.target.value)}
                        disabled={disabled}
                        className="h-7 text-xs"
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={() => removeRow(ri)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {table.headers.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Row
        </Button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export const RichContentEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const content = parseValue(value);

  const update = (patch: Partial<RichContent>) => {
    onChange(JSON.stringify({ ...content, ...patch }));
  };

  return (
    <div className="space-y-6">
      {/* Takeaways */}
      <TagList
        label="Takeaways"
        items={content.takeaways}
        disabled={disabled}
        onChange={takeaways => update({ takeaways })}
        placeholder="Add a takeaway and press Enter"
      />

      {/* Guide */}
      <div>
        <label className="block text-sm font-medium mb-1">Guide</label>
        <Textarea
          value={content.guide}
          onChange={e => update({ guide: e.target.value })}
          disabled={disabled}
          rows={4}
          placeholder="Buying / selection guide text"
        />
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-4">
        <TagList
          label="Pros"
          items={content.pros_cons.pros}
          disabled={disabled}
          onChange={pros => update({ pros_cons: { ...content.pros_cons, pros } })}
          placeholder="Add a pro and press Enter"
        />
        <TagList
          label="Cons"
          items={content.pros_cons.cons}
          disabled={disabled}
          onChange={cons => update({ pros_cons: { ...content.pros_cons, cons } })}
          placeholder="Add a con and press Enter"
        />
      </div>

      {/* Comparison Table */}
      <CompTableEditor
        table={content.comp_table}
        disabled={disabled}
        onChange={comp_table => update({ comp_table })}
      />

      {/* Related */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Related Categories</label>
        <div className="flex flex-wrap gap-1 min-h-[28px]">
          {content.related.map((item, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {item}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => update({ related: content.related.filter((_, idx) => idx !== i) })}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <RelatedInput items={content.related} disabled={disabled} onChange={related => update({ related })} />
      </div>
    </div>
  );
};

function RelatedInput({
  items,
  disabled,
  onChange,
}: {
  items: string[];
  disabled?: boolean;
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInput('');
      return;
    }
    if (!items.includes(trimmed)) onChange([...items, trimmed]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && input === '' && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a related category and press Enter or comma"
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
  );
}
