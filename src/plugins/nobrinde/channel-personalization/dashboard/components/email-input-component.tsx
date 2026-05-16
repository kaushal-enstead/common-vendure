import { AffixedInput, DashboardFormComponent, useFormContext } from '@vendure/dashboard';
import { Mail, Check, X } from 'lucide-react';
export const EmailInputComponent: DashboardFormComponent = ({ name, value, onChange, disabled }) => {
  const { getFieldState } = useFormContext();
  const isValid = getFieldState(name).invalid === false;

  return (
    <AffixedInput
      prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
      suffix={
        value &&
        (isValid ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />)
      }
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Enter email address"
      className="pl-10 pr-10"
      name={name}
      onBlur={() => {}}
      ref={() => {}}
    />
  );
};
