import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export const controlClass =
  'w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-[1rem] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:bg-sunken disabled:text-ink-3 aria-[invalid=true]:border-danger';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">({optional})</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={hintId} role="alert" className="text-sm text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: string;
  suffix?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, hint, error, optional, suffix, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClass, 'h-12', suffix ? 'pr-12' : undefined)}
            {...rest}
          />
          {suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-3">
              {suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextAreaField(
  { label, hint, error, optional, className, rows = 3, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(controlClass, 'resize-y py-3 leading-relaxed')}
          {...rest}
        />
      )}
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
};

/** Native select: best keyboard, screen reader and mobile picker support. */
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, hint, error, optional, options, placeholder, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClass, 'h-12 appearance-none pr-10')}
            {...rest}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        </div>
      )}
    </Field>
  );
});

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <span className="text-[0.9375rem] font-medium text-ink">{label}</span>
        {description && <span className="text-sm text-ink-3">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" {...rest} />
      <label htmlFor={id} className="text-sm leading-relaxed text-ink-2">
        {label}
      </label>
    </div>
  );
}
