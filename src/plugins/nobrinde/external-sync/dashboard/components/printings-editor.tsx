import { DashboardFormComponent, Input, NumberInput, Switch } from '@vendure/dashboard';

type Printings = {
  handling_costs: {
    handling_cost: number;
    handling_cost_code: string;
    has_handling: boolean;
  };
  included_services: {
    has_included_1_color_printing: boolean;
    has_included_full_printing: boolean;
    has_included_laser_printing: boolean;
    has_included_uv_printing: boolean;
    included_printings_json: string;
  };
  printing_capabilities: {
    has_marking: boolean;
    print_codes: string[];
    printing_hard: boolean;
  };
};

const defaultPrintings: Printings = {
  handling_costs: {
    handling_cost: 0,
    handling_cost_code: '',
    has_handling: false,
  },
  included_services: {
    has_included_1_color_printing: false,
    has_included_full_printing: false,
    has_included_laser_printing: false,
    has_included_uv_printing: false,
    included_printings_json: '',
  },
  printing_capabilities: {
    has_marking: false,
    print_codes: [],
    printing_hard: false,
  },
};

function parsePrintingsInput(value: unknown): Partial<Printings> {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Partial<Printings>;
  }
  if (typeof value !== 'string') {
    return {};
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return typeof parsed === 'object' && parsed != null && !Array.isArray(parsed)
      ? (parsed as Partial<Printings>)
      : {};
  } catch {
    return {};
  }
}

export const PrintingsEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const printings: Printings = {
    ...defaultPrintings,
    ...parsePrintingsInput(value),
  };

  const updateSection = <S extends keyof Printings, K extends keyof Printings[S]>(
    section: S,
    key: K,
    newValue: Printings[S][K],
  ) => {
    onChange({
      ...printings,
      [section]: {
        ...printings[section],
        [key]: newValue,
      },
    });
  };

  return (
    <div
      className="space-y-8"
      style={{
        // Span full width when the form uses 2-column grid
        width: '200%',
        maxWidth: 'none',
      }}
    >
      {/* Handling costs */}
      <section className="space-y-4">
        <header>
          <h3 className="text-sm font-semibold">Handling costs</h3>
          <div className="mt-2 h-px w-full bg-border" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Has handling</label>
            <Switch
              checked={printings.handling_costs.has_handling}
              onCheckedChange={val => updateSection('handling_costs', 'has_handling', !!val)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Handling cost</label>
            <NumberInput
              name="handling_cost"
              value={printings.handling_costs.handling_cost}
              onChange={val => updateSection('handling_costs', 'handling_cost', val ?? 0)}
              disabled={disabled}
              onBlur={() => {}}
              ref={() => {}}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Handling cost code</label>
            <Input
              value={printings.handling_costs.handling_cost_code}
              onChange={e => updateSection('handling_costs', 'handling_cost_code', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      {/* Included services */}
      <section className="space-y-4">
        <header>
          <h3 className="text-sm font-semibold">Included services</h3>
          <div className="mt-2 h-px w-full bg-border" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.included_services.has_included_1_color_printing}
              onCheckedChange={val =>
                updateSection('included_services', 'has_included_1_color_printing', !!val)
              }
              disabled={disabled}
            />
            <span className="text-sm">1-color printing included</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.included_services.has_included_full_printing}
              onCheckedChange={val => updateSection('included_services', 'has_included_full_printing', !!val)}
              disabled={disabled}
            />
            <span className="text-sm">Full printing included</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.included_services.has_included_laser_printing}
              onCheckedChange={val =>
                updateSection('included_services', 'has_included_laser_printing', !!val)
              }
              disabled={disabled}
            />
            <span className="text-sm">Laser printing included</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.included_services.has_included_uv_printing}
              onCheckedChange={val => updateSection('included_services', 'has_included_uv_printing', !!val)}
              disabled={disabled}
            />
            <span className="text-sm">UV printing included</span>
          </div>
        </div>
        <div className="pt-1">
          <label className="block text-sm font-medium mb-1">Included printings JSON</label>
          <Input
            value={printings.included_services.included_printings_json}
            onChange={e => updateSection('included_services', 'included_printings_json', e.target.value)}
            disabled={disabled}
            placeholder='Optional JSON payload, e.g. [{ "code": "D", "name": "1 color" }]'
          />
        </div>
      </section>

      {/* Printing capabilities */}
      <section className="space-y-4">
        <header>
          <h3 className="text-sm font-semibold">Printing capabilities</h3>
          <div className="mt-2 h-px w-full bg-border" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.printing_capabilities.has_marking}
              onCheckedChange={val => updateSection('printing_capabilities', 'has_marking', !!val)}
              disabled={disabled}
            />
            <span className="text-sm">Has marking</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={printings.printing_capabilities.printing_hard}
              onCheckedChange={val => updateSection('printing_capabilities', 'printing_hard', !!val)}
              disabled={disabled}
            />
            <span className="text-sm">Hard to print</span>
          </div>
        </div>
        <div className="pt-1">
          <label className="block text-sm font-medium mb-1">Print codes</label>
          <Input
            value={printings.printing_capabilities.print_codes.join(',')}
            onChange={e =>
              updateSection(
                'printing_capabilities',
                'print_codes',
                e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean),
              )
            }
            disabled={disabled}
            placeholder='Comma-separated codes, e.g. "D,F,H"'
          />
        </div>
      </section>
    </div>
  );
};
