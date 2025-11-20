import { Select } from './Select';
import { Input } from './Input';

interface SuitConfigurationProps {
  suitType: string;
  lapelType: string;
  buttonType: string;
  ventType: string;
  onChange: (field: string, value: string) => void;
}

const LAPEL_OPTIONS = [
  { value: '', label: 'Select lapel type...' },
  { value: 'notch', label: 'Notch Lapel' },
  { value: 'peak', label: 'Peak Lapel' },
  { value: 'shawl', label: 'Shawl Lapel' },
];

const VENT_OPTIONS = [
  { value: '', label: 'Select vent type...' },
  { value: 'single', label: 'Single Vent' },
  { value: 'double', label: 'Double Vent' },
  { value: 'none', label: 'No Vent' },
];

export function SuitConfiguration({
  suitType,
  lapelType,
  buttonType,
  ventType,
  onChange
}: SuitConfigurationProps) {
  const getButtonOptions = () => {
    if (suitType === 'single_breasted') {
      return [
        { value: '', label: 'Select buttons...' },
        { value: '1', label: '1 Button' },
        { value: '2', label: '2 Buttons' },
        { value: '3', label: '3 Buttons' },
      ];
    }
    if (suitType === 'tuxedo') {
      return [
        { value: '', label: 'Select buttons...' },
        { value: '1', label: '1 Button' },
        { value: '2', label: '2 Buttons' },
      ];
    }
    return null;
  };

  const buttonOptions = getButtonOptions();
  const showButtonInput = suitType === 'double_breasted';
  const showButtonSelect = buttonOptions !== null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Suit Type *"
          value={suitType}
          onChange={(e) => onChange('suitType', e.target.value)}
          options={[
            { value: '', label: 'Select suit type...' },
            { value: 'single_breasted', label: 'Single Breasted' },
            { value: 'double_breasted', label: 'Double Breasted' },
            { value: 'tuxedo', label: 'Tuxedo' },
          ]}
        />

        <Select
          label="Lapel Type"
          value={lapelType}
          onChange={(e) => onChange('lapelType', e.target.value)}
          options={LAPEL_OPTIONS}
        />

        {showButtonSelect && (
          <Select
            label="Button Configuration"
            value={buttonType}
            onChange={(e) => onChange('buttonType', e.target.value)}
            options={buttonOptions!}
          />
        )}

        {showButtonInput && (
          <Input
            label="Button Configuration"
            type="text"
            value={buttonType}
            onChange={(e) => onChange('buttonType', e.target.value)}
            placeholder="e.g., 6x2, 4x1"
          />
        )}

        <Select
          label="Vent Type"
          value={ventType}
          onChange={(e) => onChange('ventType', e.target.value)}
          options={VENT_OPTIONS}
        />
      </div>
    </div>
  );
}
