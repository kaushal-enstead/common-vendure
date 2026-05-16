import { Button, DashboardFormComponent, Input, Textarea } from '@vendure/dashboard';
import { Plus, Trash2 } from 'lucide-react';

type Faq = {
  question: string;
  answer: string;
};

function parseValue(value: unknown): Faq[] {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const json = JSON.parse(value);
      return Array.isArray(json) ? json : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) return value as Faq[];
  return [];
}

export const FaqsEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const faqs = parseValue(value);

  const update = (next: Faq[]) => onChange(JSON.stringify(next));

  const addFaq = () => {
    update([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index: number) => {
    update(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: keyof Faq, val: string) => {
    update(faqs.map((faq, i) => (i === index ? { ...faq, [field]: val } : faq)));
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">FAQ {i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => removeFaq(i)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Question</label>
            <Input
              value={faq.question}
              onChange={e => updateFaq(i, 'question', e.target.value)}
              disabled={disabled}
              placeholder="Enter question"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Answer</label>
            <Textarea
              value={faq.answer}
              onChange={e => updateFaq(i, 'answer', e.target.value)}
              disabled={disabled}
              rows={3}
              placeholder="Enter answer"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addFaq}
        disabled={disabled}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        Add FAQ
      </Button>
    </div>
  );
};
