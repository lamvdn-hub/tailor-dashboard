// Order vocabulary and status workflows. Must match the check constraints in
// supabase/migrations/*_core_schema.sql.

export const SERVICES = ['mtm', 'bespoke'] as const;
export type Service = (typeof SERVICES)[number];

export const GARMENTS = ['jacket', 'trousers', 'suit'] as const;
export type Garment = (typeof GARMENTS)[number];

export const ORDER_STATUSES = ['received', 'fitting', 'fitting_1', 'fitting_2', 'ready', 'collected'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const WORKFLOWS: Record<Service, readonly OrderStatus[]> = {
  mtm: ['received', 'fitting', 'ready', 'collected'],
  bespoke: ['received', 'fitting_1', 'fitting_2', 'ready', 'collected'],
};

export function workflowFor(service: Service): readonly OrderStatus[] {
  return WORKFLOWS[service];
}

export function nextStatus(service: Service, status: OrderStatus): OrderStatus | null {
  const steps = WORKFLOWS[service];
  const index = steps.indexOf(status);
  if (index < 0 || index === steps.length - 1) return null;
  return steps[index + 1] ?? null;
}

/**
 * Maps a status onto a service's workflow when the service changes, keeping
 * the order at the equivalent stage (any fitting stays a fitting).
 */
export function coerceStatus(service: Service, status: OrderStatus): OrderStatus {
  if (WORKFLOWS[service].includes(status)) return status;
  if (service === 'mtm') return 'fitting';
  return status === 'fitting' ? 'fitting_1' : 'received';
}

/** Coarse grouping used for filters and colour coding. */
export type StatusGroup = 'open' | 'fitting' | 'ready' | 'collected';

export function statusGroup(status: OrderStatus): StatusGroup {
  switch (status) {
    case 'received':
      return 'open';
    case 'fitting':
    case 'fitting_1':
    case 'fitting_2':
      return 'fitting';
    case 'ready':
      return 'ready';
    case 'collected':
      return 'collected';
  }
}

export const STATUS_GROUPS: StatusGroup[] = ['open', 'fitting', 'ready', 'collected'];

export function statusesInGroup(group: StatusGroup): OrderStatus[] {
  return ORDER_STATUSES.filter((s) => statusGroup(s) === group);
}

export function isActive(status: OrderStatus): boolean {
  return status !== 'collected';
}

// Suit style options ---------------------------------------------------------

export const SUIT_CUTS = ['single_breasted', 'double_breasted', 'tuxedo'] as const;
export type SuitCut = (typeof SUIT_CUTS)[number];

export const LAPELS = ['notch', 'peak', 'shawl'] as const;
export type Lapel = (typeof LAPELS)[number];

export const VENTS = ['single', 'double', 'none'] as const;
export type Vent = (typeof VENTS)[number];

export interface SuitStyle {
  cut?: SuitCut;
  lapel?: Lapel;
  /** "1"–"3" for single breasted / tuxedo, free text like "6x2" for double breasted. */
  buttons?: string;
  vent?: Vent;
}

export function buttonChoices(cut: SuitCut | undefined): string[] | null {
  if (cut === 'single_breasted') return ['1', '2', '3'];
  if (cut === 'tuxedo') return ['1', '2'];
  return null;
}

/** Drops options that no longer apply after the cut changes. */
export function normalizeStyle(style: SuitStyle): SuitStyle {
  const choices = buttonChoices(style.cut);
  const next: SuitStyle = { ...style };
  if (choices && next.buttons && !choices.includes(next.buttons)) delete next.buttons;
  if (!style.cut) delete next.buttons;
  return next;
}

export function hasJacket(garment: Garment): boolean {
  return garment === 'jacket' || garment === 'suit';
}

export function hasTrousers(garment: Garment): boolean {
  return garment === 'trousers' || garment === 'suit';
}
