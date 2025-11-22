import { Slider } from './Slider';

interface MinGainControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function MinGainControl({ value, onChange, disabled }: MinGainControlProps) {
  return (
    <Slider
      label="Min Gain"
      value={value}
      min={0.01}
      max={2}
      step={0.01}
      formatValue={(v) => `${v.toFixed(2)}x`}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
