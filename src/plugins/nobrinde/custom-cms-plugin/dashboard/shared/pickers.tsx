import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent } from '@vendure/dashboard';
import { gqlFetch } from './gql';

/* ====================== Base modal (robust) ====================== */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="w-[min(900px,92vw)] max-h-[90vh] overflow-hidden rounded-lg bg-background shadow-lg border flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="font-medium">{title}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={e => {
              e.preventDefault();
              onClose();
            }}
          >
            Close
          </Button>
        </div>
        <div className="p-3 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

/* ====================== Chips ====================== */
export function Chips({
  values,
  onRemove,
}: {
  values: Array<{ id: string; label: string }>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.length === 0 ? (
        <span className="text-xs text-muted-foreground">None</span>
      ) : (
        values.map(v => (
          <span
            key={v.id}
            className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs"
            title={v.label}
          >
            <span className="opacity-70 truncate max-w-[180px]">{v.label}</span>
            <button
              type="button"
              className="opacity-60 hover:opacity-100"
              onClick={e => {
                e.preventDefault();
                onRemove(v.id);
              }}
            >
              ✕
            </button>
          </span>
        ))
      )}
    </div>
  );
}

/* ====================== Payload FAQ Picker ====================== */
const Q_PAYLOAD_FAQS = `query($term:String){ payloadFaqs(term:$term){ id code question } }`;

type SimpleItem = {
  id: string;
  code?: string | null;
  question?: string | null;
};

export function PayloadFaqPicker(p: {
  open: boolean;
  onClose: () => void;
  onPick: (items: SimpleItem[]) => void;
  multi?: boolean;
  single?: boolean;
}) {
  const [term, setTerm] = useState('');
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!p.open) {
      setPicked({});
      return;
    }
  }, [p.open]);

  useEffect(() => {
    if (!p.open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await gqlFetch<any>(Q_PAYLOAD_FAQS, { term: term || null });
        if (!mounted) return;
        const list = data?.payloadFaqs as SimpleItem[];
        setItems(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [p.open, term]);

  function confirm() {
    const chosen = items.filter(i => picked[i.id]);
    p.onPick(p.multi ? chosen : chosen.slice(0, 1));
    p.onClose();
  }

  function onSingleChoose(id: string) {
    const found = items.find(i => i.id === id);
    if (found) {
      p.onPick([found]);
      p.onClose();
    }
  }

  const inputType = p.single ? 'radio' : p.multi ? 'checkbox' : 'radio';

  return (
    <Modal open={p.open} title="Select Payload FAQs" onClose={p.onClose}>
      <div className="flex items-center gap-2 mb-3">
        <input
          className="w-full rounded-md border p-2"
          placeholder="Search…"
          value={term}
          onChange={e => setTerm(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={e => {
            e.preventDefault();
          }}
        >
          Search
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 px-3 border-b w-0"></th>
                <th className="py-2 px-3 border-b">Question</th>
                <th className="py-2 px-3 border-b">Code</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 px-3" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="py-3 px-3" colSpan={3}>
                    No results.
                  </td>
                </tr>
              ) : (
                items.map(i => {
                  const label = i.question || i.code || i.id;
                  const checked = !!picked[i.id];
                  return (
                    <tr key={i.id} className="hover:bg-muted/40">
                      <td className="py-2 px-3">
                        <input
                          type={inputType}
                          name="pick-payload-faq"
                          checked={checked}
                          onChange={() =>
                            p.single
                              ? onSingleChoose(i.id)
                              : p.multi
                                ? setPicked(prev => ({ ...prev, [i.id]: !prev[i.id] }))
                                : onSingleChoose(i.id)
                          }
                        />
                      </td>
                      <td className="py-2 px-3">{label}</td>
                      <td className="py-2 px-3">{i.code || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 mt-3">
        <Button
          type="button"
          variant="outline"
          onClick={e => {
            e.preventDefault();
            p.onClose();
          }}
        >
          Cancel
        </Button>
        {!p.single && p.multi && (
          <Button
            type="button"
            onClick={e => {
              e.preventDefault();
              confirm();
            }}
            disabled={!Object.values(picked).some(Boolean)}
          >
            Select
          </Button>
        )}
      </div>
    </Modal>
  );
}
