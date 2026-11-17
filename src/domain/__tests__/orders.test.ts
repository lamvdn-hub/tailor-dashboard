import { describe, expect, it } from 'vitest';
import { buttonChoices, coerceStatus, nextStatus, normalizeStyle, statusGroup, statusesInGroup, workflowFor } from '../orders';

describe('order workflows', () => {
  it('has distinct workflows for MTM and bespoke', () => {
    expect(workflowFor('mtm')).toEqual(['received', 'fitting', 'ready', 'collected']);
    expect(workflowFor('bespoke')).toEqual(['received', 'fitting_1', 'fitting_2', 'ready', 'collected']);
  });

  it('advances one step and stops at the end', () => {
    expect(nextStatus('bespoke', 'fitting_1')).toBe('fitting_2');
    expect(nextStatus('mtm', 'collected')).toBeNull();
  });

  it('maps statuses when the service changes', () => {
    expect(coerceStatus('mtm', 'fitting_2')).toBe('fitting');
    expect(coerceStatus('bespoke', 'fitting')).toBe('fitting_1');
    expect(coerceStatus('bespoke', 'ready')).toBe('ready');
  });

  it('groups every status exactly once', () => {
    expect(statusGroup('fitting_2')).toBe('fitting');
    expect(statusesInGroup('fitting')).toEqual(['fitting', 'fitting_1', 'fitting_2']);
  });
});

describe('suit style', () => {
  it('limits buttons by cut', () => {
    expect(buttonChoices('tuxedo')).toEqual(['1', '2']);
    expect(buttonChoices('double_breasted')).toBeNull();
  });

  it('drops button choices that no longer apply', () => {
    expect(normalizeStyle({ cut: 'tuxedo', buttons: '3' })).toEqual({ cut: 'tuxedo' });
    expect(normalizeStyle({ cut: 'double_breasted', buttons: '6x2' })).toEqual({ cut: 'double_breasted', buttons: '6x2' });
  });
});
