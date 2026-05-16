import {
  DashboardFormComponent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vendure/dashboard';

const FONT_FAMILY_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Helvetica Neue", sans-serif', label: 'Helvetica Neue' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

export const FontFamilySelect: DashboardFormComponent = ({ value, onChange, disabled }) => {
  const currentValue = value ? String(value) : '';
  const NONE_VALUE = '__NONE__';

  return (
    <Select
      value={currentValue || NONE_VALUE}
      onValueChange={selected => onChange(selected === NONE_VALUE ? null : selected)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select font family" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <span className="text-muted-foreground">System default</span>
        </SelectItem>
        {FONT_FAMILY_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span style={{ fontFamily: option.value }}>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
