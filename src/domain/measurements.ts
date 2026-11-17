// Single source of truth for every measurement the app knows about: form
// rows, the guided diagram, range warnings and storage keys all derive from
// MEASUREMENTS. Keys are persisted in orders.measurements (jsonb) — never
// rename one without a data migration.

import { hasJacket, hasTrousers, type Garment } from './orders';

export type Section = 'body' | 'jacket' | 'trousers';
export type Unit = 'cm' | 'kg';

/** Where the measurement is drawn on the body figure (viewBox 0 0 200 460). */
export type DiagramMark =
  | { kind: 'girth'; y: number; x1: number; x2: number }
  | { kind: 'length'; x1: number; y1: number; x2: number; y2: number; back?: boolean };

export interface MeasurementDef {
  key: string;
  section: Section;
  paired: boolean;
  unit: Unit;
  min: number;
  max: number;
  mark?: DiagramMark;
}

const def = (
  key: string,
  section: Section,
  min: number,
  max: number,
  mark?: DiagramMark,
  opts: { paired?: boolean; unit?: Unit } = {},
): MeasurementDef => ({ key, section, min, max, mark, paired: opts.paired ?? false, unit: opts.unit ?? 'cm' });

export const MEASUREMENTS: readonly MeasurementDef[] = [
  def('body.height', 'body', 140, 220, { kind: 'length', x1: 188, y1: 16, x2: 188, y2: 446 }),
  def('body.weight', 'body', 40, 200, undefined, { unit: 'kg' }),

  def('jacket.neck', 'jacket', 30, 55, { kind: 'girth', y: 64, x1: 91, x2: 109 }),
  def('jacket.shoulder_width', 'jacket', 35, 60, { kind: 'length', x1: 56, y1: 80, x2: 144, y2: 80, back: true }),
  def('jacket.chest', 'jacket', 70, 150, { kind: 'girth', y: 108, x1: 56, x2: 144 }),
  def('jacket.waist', 'jacket', 60, 140, { kind: 'girth', y: 150, x1: 59, x2: 141 }),
  def('jacket.seat', 'jacket', 70, 150, { kind: 'girth', y: 198, x1: 59, x2: 141 }),
  def('jacket.back_length', 'jacket', 60, 100, { kind: 'length', x1: 100, y1: 70, x2: 100, y2: 206, back: true }),
  def('jacket.front_length', 'jacket', 60, 100, { kind: 'length', x1: 86, y1: 72, x2: 86, y2: 206 }),
  def('jacket.half_back', 'jacket', 15, 35, { kind: 'length', x1: 100, y1: 94, x2: 142, y2: 94, back: true }),
  def('jacket.sleeve_length', 'jacket', 50, 100, { kind: 'length', x1: 146, y1: 84, x2: 165, y2: 226 }, { paired: true }),
  def('jacket.bicep', 'jacket', 20, 60, { kind: 'girth', y: 118, x1: 146, x2: 160 }, { paired: true }),
  def('jacket.cuff', 'jacket', 15, 35, { kind: 'girth', y: 220, x1: 154, x2: 168 }),

  def('trousers.waist', 'trousers', 60, 140, { kind: 'girth', y: 172, x1: 58, x2: 142 }),
  def('trousers.seat', 'trousers', 70, 150, { kind: 'girth', y: 200, x1: 59, x2: 141 }),
  def('trousers.rise', 'trousers', 20, 50, { kind: 'length', x1: 100, y1: 172, x2: 100, y2: 214 }),
  def('trousers.crotch_depth', 'trousers', 20, 50, { kind: 'length', x1: 136, y1: 172, x2: 136, y2: 214, back: true }),
  def('trousers.inseam', 'trousers', 60, 100, { kind: 'length', x1: 96, y1: 216, x2: 92, y2: 432 }, { paired: true }),
  def('trousers.outseam', 'trousers', 80, 130, { kind: 'length', x1: 60, y1: 172, x2: 70, y2: 432 }, { paired: true }),
  def('trousers.thigh', 'trousers', 40, 80, { kind: 'girth', y: 238, x1: 62, x2: 98 }, { paired: true }),
  def('trousers.knee', 'trousers', 30, 60, { kind: 'girth', y: 322, x1: 68, x2: 96 }, { paired: true }),
  def('trousers.waist_to_knee', 'trousers', 40, 80, { kind: 'length', x1: 130, y1: 172, x2: 130, y2: 322 }),
  def('trousers.hem_opening', 'trousers', 15, 30, { kind: 'girth', y: 428, x1: 71, x2: 93 }),
];

const BY_KEY = new Map(MEASUREMENTS.map((m) => [m.key, m]));

export function measurementByKey(key: string): MeasurementDef | undefined {
  return BY_KEY.get(key);
}

export function sectionsFor(garment: Garment): Section[] {
  const sections: Section[] = [];
  if (hasJacket(garment)) sections.push('jacket');
  if (hasTrousers(garment)) sections.push('trousers');
  sections.push('body');
  return sections;
}

export function measurementsFor(garment: Garment): MeasurementDef[] {
  const sections = sectionsFor(garment);
  return sections.flatMap((s) => MEASUREMENTS.filter((m) => m.section === s));
}

// Values ---------------------------------------------------------------------

export type Paired = { l?: number; r?: number };
export type MeasurementValue = number | Paired;
export type MeasurementValues = Record<string, MeasurementValue>;

export function isPairedValue(v: MeasurementValue | undefined): v is Paired {
  return typeof v === 'object' && v !== null;
}

export function hasValue(def: MeasurementDef, v: MeasurementValue | undefined): boolean {
  if (v === undefined) return false;
  if (def.paired) return isPairedValue(v) && (v.l !== undefined || v.r !== undefined);
  return typeof v === 'number';
}

export function isOutOfRange(def: MeasurementDef, n: number | undefined): boolean {
  return n !== undefined && (n < def.min || n > def.max);
}

export function valueOutOfRange(def: MeasurementDef, v: MeasurementValue | undefined): boolean {
  if (v === undefined) return false;
  if (isPairedValue(v)) return isOutOfRange(def, v.l) || isOutOfRange(def, v.r);
  return isOutOfRange(def, v);
}

/** Accepts "64", "64,5", "64.5", " 64 , 5 " → 64.5. Returns undefined for blank/invalid. */
export function parseMeasurement(input: string): number | undefined {
  const cleaned = input.replace(/\s+/g, '').replace(',', '.');
  if (cleaned === '') return undefined;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Sets or clears one side/value immutably, removing empty entries. */
export function setValue(
  values: MeasurementValues,
  def: MeasurementDef,
  side: 'l' | 'r' | null,
  n: number | undefined,
): MeasurementValues {
  const next = { ...values };
  if (def.paired) {
    const current = isPairedValue(next[def.key]) ? { ...(next[def.key] as Paired) } : {};
    if (side === null) throw new Error(`${def.key} is paired; a side is required`);
    if (n === undefined) delete current[side];
    else current[side] = n;
    if (current.l === undefined && current.r === undefined) delete next[def.key];
    else next[def.key] = current;
  } else if (n === undefined) {
    delete next[def.key];
  } else {
    next[def.key] = n;
  }
  return next;
}

/** Keeps only known keys of the given garment with well-formed values. */
export function sanitizeValues(raw: unknown, garment?: Garment): MeasurementValues {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const allowed = garment ? new Set(measurementsFor(garment).map((m) => m.key)) : null;
  const out: MeasurementValues = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const d = BY_KEY.get(key);
    if (!d || (allowed && !allowed.has(key))) continue;
    if (d.paired && typeof value === 'object' && value !== null) {
      const p: Paired = {};
      const { l, r } = value as Record<string, unknown>;
      if (typeof l === 'number' && Number.isFinite(l)) p.l = l;
      if (typeof r === 'number' && Number.isFinite(r)) p.r = r;
      if (p.l !== undefined || p.r !== undefined) out[key] = p;
    } else if (!d.paired && typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

export function completion(garment: Garment, values: MeasurementValues): { done: number; total: number } {
  const defs = measurementsFor(garment);
  return { done: defs.filter((d) => hasValue(d, values[d.key])).length, total: defs.length };
}

/**
 * Copies values from a previous order for the target garment. Shared body
 * measurements (e.g. height) carry over regardless of the source garment.
 */
export function carryOver(previous: unknown, garment: Garment): MeasurementValues {
  return sanitizeValues(previous, garment);
}
