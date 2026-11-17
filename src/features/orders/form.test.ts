import { describe, expect, it } from 'vitest';
import { emptyForm, updateForm, validateForm } from './form';

describe('order form', () => {
  it('requires a client', () => {
    expect(validateForm(emptyForm()).errors.clientId).toBe('required');
  });

  it('rejects a deposit larger than the price', () => {
    const form = { ...emptyForm('c1'), price: '1000', deposit: '2000' };
    expect(validateForm(form).errors.deposit).toBe('depositTooHigh');
  });

  it('keeps status valid when switching service', () => {
    const form = updateForm({ ...emptyForm('c1'), service: 'bespoke', status: 'fitting_2' }, { service: 'mtm' });
    expect(form.status).toBe('fitting');
  });

  it('builds a clean insert payload', () => {
    const form = {
      ...emptyForm('c1'),
      garment: 'trousers' as const,
      style: { cut: 'tuxedo' as const },
      measurements: { 'trousers.waist': 80, 'jacket.chest': 100 },
      styleNotes: '  slim  ',
      jacketNotes: 'ignored',
      price: '12 500',
      deposit: '',
    };
    const { input } = validateForm(form);
    expect(input).toMatchObject({
      client_id: 'c1',
      style: {},
      measurements: { 'trousers.waist': 80 },
      style_notes: 'slim',
      jacket_notes: null,
      price_minor: 1250000,
      deposit_minor: 0,
      due_date: null,
    });
  });
});
