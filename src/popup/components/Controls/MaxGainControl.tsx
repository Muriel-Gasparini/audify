import { Slider } from './Slider';

interface MaxGainControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function MaxGainControl({ value, onChange, disabled }: MaxGainControlProps) {
  return (
    <Slider
      label="Max Gain"
      value={value}
      min={0.1}
      max={16}
      step={0.1}
      formatValue={(v) => `${v.toFixed(1)}x`}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
