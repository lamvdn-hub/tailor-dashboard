import { AlertTriangle } from 'lucide-react';
import {
  isPairedValue,
  measurementsFor,
  sectionsFor,
  setValue,
  valueOutOfRange,
  type MeasurementDef,
  type MeasurementValues,
} from '@/domain/measurements';
import type { Garment } from '@/domain/orders';
import { useI18n } from '@/i18n';
import { MeasureInput } from './MeasureInput';

interface Props {
  garment: Garment;
  values: MeasurementValues;
  onChange?: (values: MeasurementValues) => void;
}

/** Sectioned measurement sheet. Editable when onChange is given. */
export function MeasurementTable({ garment, values, onChange }: Props) {
  const { t, fmt } = useI18n();
  const defs = measurementsFor(garment);

  const show = (n: number | undefined, def: MeasurementDef) => (n === undefined ? '–' : `${fmt.number(n)} ${def.unit}`);

  return (
    <div className="flex flex-col gap-5">
      {sectionsFor(garment).map((section) => (
        <div key={section}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">{t.measurements.sections[section]}</h3>
          <dl className="divide-y divide-line">
            {defs
              .filter((d) => d.section === section)
              .map((def) => {
                const name = t.measurements.names[def.key] ?? def.key;
                const v = values[def.key];
                const warn = valueOutOfRange(def, v);
                return (
                  <div key={def.key} className="flex min-h-12 items-center gap-3 py-1.5">
                    <dt className="flex min-w-0 flex-1 items-center gap-1.5 text-[0.9375rem] text-ink-2">
                      <span className="truncate">{name}</span>
                      {!onChange && warn && (
                        <AlertTriangle aria-label={t.measurements.outOfRange(def.min, def.max, def.unit)} className="size-3.5 shrink-0 text-warn" />
                      )}
                    </dt>
                    <dd className="flex shrink-0 gap-2">
                      {onChange ? (
                        def.paired ? (
                          (['l', 'r'] as const).map((side) => (
                            <div key={side} className="w-[6.5rem]">
                              <MeasureInput
                                compact
                                def={def}
                                label={`${name} – ${side === 'l' ? t.measurements.leftLong : t.measurements.rightLong}`}
                                value={isPairedValue(v) ? v[side] : undefined}
                                onChange={(n) => onChange(setValue(values, def, side, n))}
                              />
                              <span aria-hidden className="mt-0.5 block text-center text-[0.6875rem] font-medium text-ink-3">
                                {side === 'l' ? t.measurements.left : t.measurements.right}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="w-[6.5rem]">
                            <MeasureInput
                              compact
                              def={def}
                              label={name}
                              value={typeof v === 'number' ? v : undefined}
                              onChange={(n) => onChange(setValue(values, def, null, n))}
                            />
                          </div>
                        )
                      ) : def.paired ? (
                        <span className="tabular text-[0.9375rem] text-ink">
                          <span className="text-ink-3">{t.measurements.left}</span> {show(isPairedValue(v) ? v.l : undefined, def)}
                          <span className="mx-2 text-line-strong">|</span>
                          <span className="text-ink-3">{t.measurements.right}</span> {show(isPairedValue(v) ? v.r : undefined, def)}
                        </span>
                      ) : (
                        <span className="tabular text-[0.9375rem] text-ink">{show(typeof v === 'number' ? v : undefined, def)}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
          </dl>
        </div>
      ))}
    </div>
  );
}
