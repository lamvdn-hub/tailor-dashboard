import { forwardRef, useEffect, useState, type KeyboardEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isOutOfRange, parseMeasurement, type MeasurementDef } from '@/domain/measurements';
import { useI18n } from '@/i18n';

interface MeasureInputProps {
  def: MeasurementDef;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label: string;
  /** Visually hide the label (table rows provide context). */
  compact?: boolean;
  onEnter?: () => void;
  size?: 'md' | 'lg';
}

/**
 * Numeric entry tuned for phones: decimal keypad, comma or dot, unit suffix,
 * soft range warning. Keeps the raw text so "64," can be typed.
 */
export const MeasureInput = forwardRef<HTMLInputElement, MeasureInputProps>(function MeasureInput(
  { def, value, onChange, label, compact, onEnter, size = 'md' },
  ref,
) {
  const { t, locale } = useI18n();
  const display = (n: number | undefined) => (n === undefined ? '' : locale === 'sv' ? String(n).replace('.', ',') : String(n));
  const [text, setText] = useState(display(value));

  // Sync when the value changes from outside (copy from latest, step change).
  useEffect(() => {
    if (parseMeasurement(text) !== value) setText(display(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const parsed = parseMeasurement(text);
  const invalid = text.trim() !== '' && parsed === undefined;
  const warn = !invalid && isOutOfRange(def, parsed);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className={cn('text-xs font-medium text-ink-3', compact && 'sr-only')}>{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint={onEnter ? 'next' : 'done'}
          aria-label={compact ? label : undefined}
          aria-invalid={invalid || undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseMeasurement(e.target.value);
            if (n !== undefined || e.target.value.trim() === '') onChange(n);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'tabular w-full rounded-[var(--radius-control)] border bg-surface pl-3 pr-10 text-right text-ink focus:outline-none focus:ring-2 focus:ring-accent/25',
            size === 'lg' ? 'h-14 text-2xl font-semibold' : 'h-11 text-base',
            invalid ? 'border-danger' : warn ? 'border-warn' : 'border-line-strong focus:border-accent',
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-3">{def.unit}</span>
      </div>
      {(invalid || warn) && !compact && (
        <p className={cn('flex items-start gap-1 text-xs', invalid ? 'text-danger-ink' : 'text-warn-ink')} role="status">
          {warn && <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />}
          {invalid ? t.measurements.invalid : t.measurements.outOfRange(def.min, def.max, def.unit)}
        </p>
      )}
    </div>
  );
});
