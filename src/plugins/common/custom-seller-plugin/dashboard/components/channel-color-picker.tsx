import {
  Button,
  Card,
  CardContent,
  cn,
  DashboardFormComponent,
  Input,
  useFormContext,
} from '@vendure/dashboard';
import { useState } from 'react';
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const ChannelColorPicker: DashboardFormComponent = ({ value, onChange, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getFieldState } = useFormContext();
  const error = getFieldState(name).error;

  const colors = [
    '#E53935',
    '#F4511E',
    '#FB8C00',
    '#FDD835',
    '#C0CA33',
    '#43A047',
    '#00897B',
    '#00ACC1',
    '#1E88E5',
    '#3949AB',
    '#5E35B1',
    '#8E24AA',
    '#D81B60',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#FF9FF3',
    '#54A0FF',
    '#5F27CD',
    '#2D3436',
    '#636E72',
    '#B2BEC3',
    '#FFFFFF',
    '#000000',
  ];

  const safeColor = typeof value === 'string' && HEX_COLOR_REGEX.test(value) ? value : '#ffffff';

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('h-8 w-8 border-2 border-gray-300 p-0', error && 'border-red-500')}
          style={{ backgroundColor: error ? 'transparent' : safeColor }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          value={value || ''}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="#ffffff"
        />
      </div>

      {isOpen && (
        <Card>
          <CardContent className="space-y-3 p-2">
            <div className="grid grid-cols-6 gap-2">
              {colors.map(color => (
                <Button
                  key={color}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-2 border-gray-300 p-0 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Any color</span>
              <input
                type="color"
                value={safeColor}
                className="h-8 w-12 cursor-pointer rounded border border-gray-300 bg-transparent p-0"
                onChange={e => onChange(e.target.value.toUpperCase())}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
