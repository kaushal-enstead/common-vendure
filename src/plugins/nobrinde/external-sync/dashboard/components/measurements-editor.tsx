import { DashboardFormComponent, Input, NumberInput } from '@vendure/dashboard';

type Measurements = {
  capacity: string;
  coating_weight: number;
  coating_weight_unit: string;
  diameter: string;
  diameter_unit: string;
  gross_weight: number;
  height: string;
  height_unit: string;
  length: string;
  length_unit: string;
  liquid_volume: string;
  liquid_volume_unit: string;
  net_weight: string;
  size_combined: string;
  size_combined_unit: string;
  volume: string;
  volume_unit: string;
  weight_unit: string;
  width: string;
  width_unit: string;
};

const defaultMeasurements: Measurements = {
  capacity: '',
  coating_weight: 0,
  coating_weight_unit: '',
  diameter: '',
  diameter_unit: 'cm',
  gross_weight: 0,
  height: '',
  height_unit: 'cm',
  length: '',
  length_unit: 'cm',
  liquid_volume: '',
  liquid_volume_unit: '',
  net_weight: '',
  size_combined: '',
  size_combined_unit: 'cm',
  volume: '',
  volume_unit: '',
  weight_unit: 'gr',
  width: '',
  width_unit: 'cm',
};

export const MeasurementsEditor: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const measurements: Measurements = {
    ...defaultMeasurements,
    ...(value ?? {}),
  };

  const handleChange = <K extends keyof Measurements>(key: K, newValue: Measurements[K]) => {
    onChange({
      ...measurements,
      [key]: newValue,
    });
  };

  return (
    <div
      className="space-y-4"
      style={{
        // Span full width when form uses 2-column grid (break out of 50% column)
        width: '200%',
        maxWidth: 'none',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <Input
            value={measurements.capacity}
            onChange={e => handleChange('capacity', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Liquid volume</label>
          <Input
            value={measurements.liquid_volume}
            onChange={e => handleChange('liquid_volume', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Liquid volume unit</label>
          <Input
            value={measurements.liquid_volume_unit}
            onChange={e => handleChange('liquid_volume_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Length</label>
          <Input
            value={measurements.length}
            onChange={e => handleChange('length', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Length unit</label>
          <Input
            value={measurements.length_unit}
            onChange={e => handleChange('length_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Width</label>
          <Input
            value={measurements.width}
            onChange={e => handleChange('width', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Width unit</label>
          <Input
            value={measurements.width_unit}
            onChange={e => handleChange('width_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height</label>
          <Input
            value={measurements.height}
            onChange={e => handleChange('height', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Height unit</label>
          <Input
            value={measurements.height_unit}
            onChange={e => handleChange('height_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Diameter</label>
          <Input
            value={measurements.diameter}
            onChange={e => handleChange('diameter', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Diameter unit</label>
          <Input
            value={measurements.diameter_unit}
            onChange={e => handleChange('diameter_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Coating weight</label>
          <NumberInput
            name="coating_weight"
            value={measurements.coating_weight}
            onChange={val => handleChange('coating_weight', val ?? 0)}
            disabled={disabled}
            onBlur={() => {}}
            ref={() => {}}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Coating weight unit</label>
          <Input
            value={measurements.coating_weight_unit}
            onChange={e => handleChange('coating_weight_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gross weight</label>
          <NumberInput
            name="gross_weight"
            value={measurements.gross_weight}
            onChange={val => handleChange('gross_weight', val ?? 0)}
            disabled={disabled}
            onBlur={() => {}}
            ref={() => {}}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Net weight</label>
          <Input
            value={measurements.net_weight}
            onChange={e => handleChange('net_weight', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weight unit</label>
          <Input
            value={measurements.weight_unit}
            onChange={e => handleChange('weight_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Volume</label>
          <Input
            value={measurements.volume}
            onChange={e => handleChange('volume', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Volume unit</label>
          <Input
            value={measurements.volume_unit}
            onChange={e => handleChange('volume_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Combined size</label>
          <Input
            value={measurements.size_combined}
            onChange={e => handleChange('size_combined', e.target.value)}
            disabled={disabled}
            placeholder="e.g. 14.40x0.00x0.00x1.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Combined size unit</label>
          <Input
            value={measurements.size_combined_unit}
            onChange={e => handleChange('size_combined_unit', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
