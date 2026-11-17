import { describe, expect, it } from 'vitest';
import sv from './sv';
import en from './en';

function shape(value: unknown, path = ''): string[] {
  if (typeof value === 'function') return [`${path}()`];
  if (typeof value !== 'object' || value === null) return [path];
  return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
}

describe('dictionaries', () => {
  it('have identical keys in Swedish and English', () => {
    expect(shape(en).sort()).toEqual(shape(sv).sort());
  });

  it('have no empty strings', () => {
    for (const dict of [sv, en]) {
      const empty = shape(dict).filter((p) => {
        const v = p.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k.replace('()', '')], dict);
        return v === '';
      });
      expect(empty).toEqual([]);
    }
  });
});
