import { Slider } from './Slider';

interface TargetLevelControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function TargetLevelControl({ value, onChange, disabled }: TargetLevelControlProps) {
  return (
    <Slider
      label="Target Level"
      value={value}
      min={0.01}
      max={0.3}
      step={0.01}
      formatValue={(v) => v.toFixed(2)}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
