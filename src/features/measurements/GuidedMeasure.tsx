import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, List as ListIcon, Scale } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  hasValue,
  isPairedValue,
  measurementsFor,
  setValue,
  type MeasurementValues,
} from '@/domain/measurements';
import type { Garment } from '@/domain/orders';
import { useI18n } from '@/i18n';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { BodyFigure } from './BodyFigure';
import { MeasureInput } from './MeasureInput';

interface Props {
  open: boolean;
  onClose: () => void;
  garment: Garment;
  values: MeasurementValues;
  onChange: (values: MeasurementValues) => void;
}

/** Step-by-step entry: one measurement per screen with figure and how-to. */
export function GuidedMeasure({ open, onClose, garment, values, onChange }: Props) {
  const { t, fmt } = useI18n();
  const defs = useMemo(() => measurementsFor(garment), [garment]);
  const [index, setIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const secondInput = useRef<HTMLInputElement>(null);

  // Start at the first empty measurement each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const firstEmpty = defs.findIndex((d) => !hasValue(d, values[d.key]));
    setIndex(firstEmpty < 0 ? 0 : firstEmpty);
    setShowList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && !showList) firstInput.current?.focus({ preventScroll: true });
  }, [index, open, showList]);

  const def = defs[index];
  const doneKeys = useMemo(() => new Set(defs.filter((d) => hasValue(d, values[d.key])).map((d) => d.key)), [defs, values]);
  if (!def) return null;

  const v = values[def.key];
  const name = t.measurements.names[def.key] ?? def.key;
  const isLast = index === defs.length - 1;
  const go = (i: number) => setIndex(Math.max(0, Math.min(defs.length - 1, i)));
  const next = () => (isLast ? onClose() : go(index + 1));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="full"
      title={
        <span className="flex items-center gap-3">
          {t.measurements.guided}
          <span className="tabular text-sm font-normal text-ink-3">{t.measurements.progress(doneKeys.size, defs.length)}</span>
        </span>
      }
      footer={
        <div className="grid w-full grid-cols-[auto_1fr_1fr] gap-2 sm:flex sm:justify-between">
          <Button variant="ghost" icon={<ListIcon className="size-4" />} onClick={() => setShowList((s) => !s)} aria-pressed={showList}>
            <span className="sr-only sm:not-sr-only">{t.measurements.jumpTo}</span>
          </Button>
          <Button variant="secondary" icon={<ChevronLeft className="size-4" />} disabled={index === 0} onClick={() => go(index - 1)}>
            {t.common.previous}
          </Button>
          <Button onClick={next}>
            {isLast ? t.measurements.finish : t.common.next}
            {!isLast && <ChevronRight className="size-4" />}
          </Button>
        </div>
      }
    >
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={defs.length}
        aria-valuenow={doneKeys.size}
      >
        <div className="h-full rounded-full bg-ok transition-[width]" style={{ width: `${(doneKeys.size / defs.length) * 100}%` }} />
      </div>

      {showList ? (
        <ol className="divide-y divide-line">
          {defs.map((d, i) => (
            <li key={d.key}>
              <button
                type="button"
                onClick={() => {
                  go(i);
                  setShowList(false);
                }}
                className={cn('flex min-h-12 w-full items-center gap-3 px-1 text-left', i === index && 'font-semibold')}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                    doneKeys.has(d.key) ? 'bg-ok text-white' : 'bg-sunken text-ink-3',
                  )}
                >
                  {doneKeys.has(d.key) ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="flex-1">{t.measurements.names[d.key]}</span>
                <span className="text-xs text-ink-3">{t.measurements.sections[d.section]}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
          <div className="flex justify-center rounded-[var(--radius-card)] bg-sunken p-3">
            {def.mark ? (
              <BodyFigure
                defs={defs}
                activeKey={def.key}
                doneKeys={doneKeys}
                onSelect={(key) => go(defs.findIndex((d) => d.key === key))}
                className="h-[30dvh] w-auto sm:h-[52dvh]"
              />
            ) : (
              <div className="flex h-[30dvh] items-center justify-center text-ink-3 sm:h-[52dvh]">
                <Scale className="size-16" aria-hidden />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                {t.measurements.sections[def.section]} · {index + 1}/{defs.length}
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h3>
              {def.mark?.kind === 'length' && def.mark.back && <p className="mt-1 text-sm text-ink-3">{t.measurements.measureBack}</p>}
            </div>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">{t.measurements.howTo[def.key]}</p>

            {def.paired ? (
              <div className="grid grid-cols-2 gap-3">
                {(['l', 'r'] as const).map((side) => (
                  <MeasureInput
                    key={`${def.key}-${side}`}
                    ref={side === 'l' ? firstInput : secondInput}
                    size="lg"
                    def={def}
                    label={side === 'l' ? t.measurements.leftLong : t.measurements.rightLong}
                    value={isPairedValue(v) ? v[side] : undefined}
                    onChange={(n) => onChange(setValue(values, def, side, n))}
                    onEnter={side === 'l' ? () => secondInput.current?.focus() : next}
                  />
                ))}
              </div>
            ) : (
              <MeasureInput
                key={def.key}
                ref={firstInput}
                size="lg"
                def={def}
                label={`${name} (${def.unit})`}
                value={typeof v === 'number' ? v : undefined}
                onChange={(n) => onChange(setValue(values, def, null, n))}
                onEnter={next}
              />
            )}

            <p className="text-xs text-ink-3">
              {fmt.number(def.min)}–{fmt.number(def.max)} {def.unit}
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
