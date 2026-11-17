import { describe, expect, it } from 'vitest';
import { balanceDue, formatMoney, moneyInputValue, parseMoney } from '../money';
import { isEmail, isOrderPrefix, isPhone, isSlug, slugify, suggestPrefix } from '../validation';

describe('money', () => {
  it.each([
    ['1 500', 150000],
    ['1500,50', 150050],
    ['1 500.5 kr', 150050],
    ['12 500:-', 1250000],
    ['', undefined],
    ['12,345', null],
    ['abc', null],
  ])('parses %j', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it('round-trips through the input format', () => {
    expect(moneyInputValue(150050, 'sv')).toBe('1500,50');
    expect(parseMoney(moneyInputValue(150050, 'sv'))).toBe(150050);
    expect(moneyInputValue(null, 'en')).toBe('');
  });

  it('formats SEK for Swedish', () => {
    expect(formatMoney(1250000, 'SEK', 'sv-SE').replace(/\s/g, ' ')).toBe('12 500 kr');
  });

  it('never returns a negative balance', () => {
    expect(balanceDue(1000, 400)).toBe(600);
    expect(balanceDue(null, 0)).toBeNull();
  });
});

describe('validation', () => {
  it('slugifies Swedish names', () => {
    expect(slugify('Åkessons Skrädderi & Ateljé')).toBe('akessons-skradderi-atelje');
    expect(isSlug(slugify('Ö'))).toBe(false);
    expect(isSlug('bo-skradderi')).toBe(true);
  });

  it('suggests order prefixes', () => {
    expect(suggestPrefix('Åkessons Skrädderi')).toBe('AS');
    expect(suggestPrefix('Tailor')).toBe('TAI');
    expect(suggestPrefix('')).toBe('ORD');
    expect(isOrderPrefix('ABCDE')).toBe(false);
  });

  it('validates contact details', () => {
    expect(isEmail('a@b.se')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isPhone('070-123 45 67')).toBe(true);
    expect(isPhone('+46 70 123 45 67')).toBe(true);
    expect(isPhone('12')).toBe(false);
  });
});
