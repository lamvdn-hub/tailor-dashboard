// Pure order-form state and validation, shared by the editor and tests.

import { coerceStatus, hasJacket, normalizeStyle, type Garment, type OrderStatus, type Service, type SuitStyle } from '@/domain/orders';
import { sanitizeValues, type MeasurementValues } from '@/domain/measurements';
import { moneyInputValue, parseMoney } from '@/domain/money';
import type { Order } from '@/lib/types';
import type { OrderInput } from './api';

export interface OrderForm {
  clientId: string;
  service: Service;
  garment: Garment;
  status: OrderStatus;
  fabricId: string;
  style: SuitStyle;
  measurements: MeasurementValues;
  styleNotes: string;
  jacketNotes: string;
  trousersNotes: string;
  clientRequests: string;
  adjustmentNotes: string;
  dueDate: string;
  price: string;
  deposit: string;
}

export function emptyForm(clientId = ''): OrderForm {
  return {
    clientId,
    service: 'mtm',
    garment: 'suit',
    status: 'received',
    fabricId: '',
    style: {},
    measurements: {},
    styleNotes: '',
    jacketNotes: '',
    trousersNotes: '',
    clientRequests: '',
    adjustmentNotes: '',
    dueDate: '',
    price: '',
    deposit: '',
  };
}

export function formFromOrder(order: Order, locale: string): OrderForm {
  return {
    clientId: order.client_id,
    service: order.service,
    garment: order.garment,
    status: order.status,
    fabricId: order.fabric_id ?? '',
    style: order.style ?? {},
    measurements: sanitizeValues(order.measurements),
    styleNotes: order.style_notes ?? '',
    jacketNotes: order.jacket_notes ?? '',
    trousersNotes: order.trousers_notes ?? '',
    clientRequests: order.client_requests ?? '',
    adjustmentNotes: order.adjustment_notes ?? '',
    dueDate: order.due_date ?? '',
    price: moneyInputValue(order.price_minor, locale),
    deposit: order.deposit_minor ? moneyInputValue(order.deposit_minor, locale) : '',
  };
}

/** Applies a change and keeps dependent fields consistent. */
export function updateForm(form: OrderForm, patch: Partial<OrderForm>): OrderForm {
  const next = { ...form, ...patch };
  if (patch.service) next.status = coerceStatus(patch.service, next.status);
  if (patch.style) next.style = normalizeStyle(patch.style);
  return next;
}

export type OrderFormErrors = Partial<Record<'clientId' | 'price' | 'deposit', 'required' | 'invalid' | 'depositTooHigh'>>;

const text = (s: string) => (s.trim() ? s.trim() : null);

export function validateForm(form: OrderForm): { input: OrderInput | null; errors: OrderFormErrors } {
  const errors: OrderFormErrors = {};
  if (!form.clientId) errors.clientId = 'required';
  const price = parseMoney(form.price);
  const deposit = parseMoney(form.deposit);
  if (price === null) errors.price = 'invalid';
  if (deposit === null) errors.deposit = 'invalid';
  if (typeof price === 'number' && typeof deposit === 'number' && deposit > price) errors.deposit = 'depositTooHigh';
  if (typeof deposit === 'number' && price === undefined && deposit > 0) errors.deposit = 'depositTooHigh';
  if (Object.keys(errors).length) return { input: null, errors };

  const isSuit = form.garment === 'suit';
  return {
    errors,
    input: {
      client_id: form.clientId,
      service: form.service,
      garment: form.garment,
      status: coerceStatus(form.service, form.status),
      fabric_id: form.fabricId || null,
      style: hasJacket(form.garment) ? normalizeStyle(form.style) : {},
      // Drop values that don't belong to the chosen garment.
      measurements: sanitizeValues(form.measurements, form.garment),
      style_notes: isSuit ? null : text(form.styleNotes),
      jacket_notes: isSuit ? text(form.jacketNotes) : null,
      trousers_notes: isSuit ? text(form.trousersNotes) : null,
      client_requests: text(form.clientRequests),
      adjustment_notes: text(form.adjustmentNotes),
      due_date: form.dueDate || null,
      price_minor: price ?? null,
      deposit_minor: deposit ?? 0,
    },
  };
}
