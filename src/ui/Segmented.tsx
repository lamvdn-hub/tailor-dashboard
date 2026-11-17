import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SegmentedProps<T extends string> {
  label: string;
  value: T | undefined;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hideLabel?: boolean;
  size?: 'md' | 'sm';
}

/** Radio group styled as a segmented control. Large hit areas for touch. */
export function Segmented<T extends string>({ label, value, options, onChange, hideLabel, size = 'md' }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={cn('mb-1.5 text-sm font-medium text-ink-2', hideLabel && 'sr-only')}>{label}</legend>
      <div className="flex rounded-[var(--radius-control)] bg-sunken p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center rounded-[0.6rem] px-2 text-center font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
              size === 'md' ? 'h-10 text-[0.9375rem]' : 'h-8 text-sm',
              value === o.value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ChipsProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
}

/** Horizontally scrollable filter chips. */
export function FilterChips<T extends string>({ label, value, options, onChange }: ChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
              active ? 'border-ink bg-ink text-canvas' : 'border-line-strong bg-surface text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular text-xs', active ? 'text-canvas/70' : 'text-ink-3')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
