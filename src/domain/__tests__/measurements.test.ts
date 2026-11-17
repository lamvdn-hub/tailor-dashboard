import { describe, expect, it } from 'vitest';
import {
  MEASUREMENTS,
  carryOver,
  completion,
  measurementByKey,
  measurementsFor,
  parseMeasurement,
  sanitizeValues,
  setValue,
  valueOutOfRange,
} from '../measurements';
import sv from '@/i18n/sv';
import en from '@/i18n/en';

describe('catalogue', () => {
  it('has unique keys prefixed by their section', () => {
    const keys = MEASUREMENTS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
    MEASUREMENTS.forEach((m) => expect(m.key.startsWith(`${m.section}.`)).toBe(true));
  });

  it('has names and instructions in every language', () => {
    for (const m of MEASUREMENTS) {
      for (const dict of [sv, en]) {
        expect(dict.measurements.names[m.key], m.key).toBeTruthy();
        expect(dict.measurements.howTo[m.key], m.key).toBeTruthy();
      }
    }
  });

  it('selects sections by garment', () => {
    const jacket = measurementsFor('jacket').map((m) => m.section);
    expect(jacket).toContain('jacket');
    expect(jacket).not.toContain('trousers');
    expect(measurementsFor('suit').length).toBe(MEASUREMENTS.length);
  });
});

describe('input parsing', () => {
  it.each([
    ['64', 64],
    ['64,5', 64.5],
    [' 64.25 ', 64.25],
    ['', undefined],
    ['abc', undefined],
    ['-3', undefined],
    ['1234', undefined],
  ])('parses %j', (input, expected) => {
    expect(parseMeasurement(input)).toBe(expected);
  });
});

describe('values', () => {
  const sleeve = measurementByKey('jacket.sleeve_length')!;
  const chest = measurementByKey('jacket.chest')!;

  it('sets and clears paired sides', () => {
    let v = setValue({}, sleeve, 'l', 64);
    v = setValue(v, sleeve, 'r', 65);
    expect(v['jacket.sleeve_length']).toEqual({ l: 64, r: 65 });
    v = setValue(v, sleeve, 'l', undefined);
    v = setValue(v, sleeve, 'r', undefined);
    expect(v).toEqual({});
  });

  it('flags out-of-range values', () => {
    expect(valueOutOfRange(chest, 200)).toBe(true);
    expect(valueOutOfRange(chest, 100)).toBe(false);
    expect(valueOutOfRange(sleeve, { l: 64, r: 10 })).toBe(true);
  });

  it('sanitises untrusted JSON', () => {
    const raw = { 'jacket.chest': 100, 'jacket.sleeve_length': { l: 64, r: 'x' }, unknown: 5, 'jacket.neck': 'bad' };
    expect(sanitizeValues(raw)).toEqual({ 'jacket.chest': 100, 'jacket.sleeve_length': { l: 64 } });
    expect(sanitizeValues(null)).toEqual({});
  });

  it('carries over only measurements relevant to the new garment', () => {
    const previous = { 'jacket.chest': 100, 'trousers.inseam': { l: 80, r: 80 }, 'body.height': 180 };
    expect(carryOver(previous, 'trousers')).toEqual({ 'trousers.inseam': { l: 80, r: 80 }, 'body.height': 180 });
  });

  it('counts completion per garment', () => {
    const { done, total } = completion('trousers', { 'trousers.waist': 80, 'jacket.chest': 100 });
    expect(done).toBe(1);
    expect(total).toBe(measurementsFor('trousers').length);
  });
});
