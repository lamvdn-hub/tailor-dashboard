// Strictly necessary, per-device preferences. Every access is guarded because
// storage can be unavailable (private mode, blocked site data).

const KEYS = {
  theme: 'pref.theme',
  locale: 'pref.locale',
  shop: 'pref.shop',
} as const;

type PrefKey = keyof typeof KEYS;

export function readPref(key: PrefKey): string | null {
  try {
    return localStorage.getItem(KEYS[key]);
  } catch {
    return null;
  }
}

export function writePref(key: PrefKey, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(KEYS[key]);
    else localStorage.setItem(KEYS[key], value);
  } catch {
    // Preference simply won't persist.
  }
}

/** Removes everything this app stores on the device (used on sign-out and from Account). */
export function clearDeviceData(): void {
  try {
    const remove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('pref.') || k.startsWith('sb-') || k.startsWith('draft.'))) remove.push(k);
    }
    remove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    // Nothing to clear.
  }
}
