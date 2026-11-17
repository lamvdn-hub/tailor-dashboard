import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Field';
import { Avatar, List, Row } from '@/ui/List';
import { cn } from '@/lib/cn';
import { describeError } from '@/lib/errors';
import { isEmail, isPhone } from '@/domain/validation';
import { clientsQuery, createClient, fullName } from './api';

interface Props {
  shopId: string;
  value: string;
  onChange: (clientId: string) => void;
  error?: string | null;
}

/** Field-like button that opens a searchable client list with inline create. */
export function ClientPicker({ shopId, value, onChange, error }: Props) {
  const { t } = useI18n();
  const clients = useQuery(clientsQuery(shopId));
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState({ first: '', last: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = clients.data?.find((c) => c.id === value);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = clients.data ?? [];
    if (!needle) return list.slice(0, 50);
    return list
      .filter((c) => `${fullName(c)} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(needle))
      .slice(0, 50);
  }, [clients.data, q]);

  const close = () => {
    setOpen(false);
    setCreating(false);
    setQ('');
    setFormError(null);
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.first.trim() || !draft.last.trim()) return;
    if (draft.email && !isEmail(draft.email)) return setFormError(t.clients.invalidEmail);
    if (draft.phone && !isPhone(draft.phone)) return setFormError(t.clients.invalidPhone);
    setBusy(true);
    try {
      const c = await createClient(shopId, {
        first_name: draft.first.trim(),
        last_name: draft.last.trim(),
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        notes: null,
      });
      await queryClient.invalidateQueries({ queryKey: ['shop', shopId, 'clients'] });
      onChange(c.id);
      setDraft({ first: '', last: '', phone: '', email: '' });
      close();
    } catch (err) {
      setFormError(describeError(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2" id="client-picker-label">
        {t.orders.client}
      </span>
      <button
        type="button"
        aria-labelledby="client-picker-label"
        aria-invalid={Boolean(error) || undefined}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-14 w-full items-center gap-3 rounded-[var(--radius-control)] border bg-surface px-3 text-left',
          error ? 'border-danger' : 'border-line-strong',
        )}
      >
        {selected ? (
          <>
            <Avatar name={fullName(selected)} className="size-9" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{fullName(selected)}</span>
              <span className="block truncate text-sm text-ink-3">{selected.phone ?? selected.email ?? ''}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-ink-3">{t.orders.selectClient}</span>
        )}
        <ChevronDown className="size-4 text-ink-3" aria-hidden />
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger-ink">
          {error}
        </p>
      )}

      <Dialog open={open} onClose={close} title={creating ? t.clients.new : t.orders.selectClient}>
        {creating ? (
          <form onSubmit={create} className="flex flex-col gap-3" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={t.clients.firstName} value={draft.first} onChange={(e) => setDraft({ ...draft, first: e.target.value })} autoFocus autoComplete="off" />
              <TextField label={t.clients.lastName} value={draft.last} onChange={(e) => setDraft({ ...draft, last: e.target.value })} autoComplete="off" />
            </div>
            <TextField label={t.clients.phone} type="tel" inputMode="tel" optional={t.common.optional} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} autoComplete="off" />
            <TextField label={t.clients.email} type="email" inputMode="email" optional={t.common.optional} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="off" />
            {formError && <p role="alert" className="text-sm text-danger-ink">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>
                {t.common.back}
              </Button>
              <Button type="submit" className="flex-1" loading={busy} disabled={!draft.first.trim() || !draft.last.trim()}>
                {t.common.create}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.orders.searchClient}
                aria-label={t.orders.searchClient}
                className="h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-10 pr-3 text-base focus:border-accent focus:outline-none"
              />
            </div>
            <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setCreating(true)}>
              {t.orders.createClientInline}
            </Button>
            <List className="-mx-5">
              {filtered.map((c) => (
                <Row
                  key={c.id}
                  onClick={() => {
                    onChange(c.id);
                    close();
                  }}
                  leading={<Avatar name={fullName(c)} className="size-9" />}
                  title={fullName(c)}
                  subtitle={c.phone ?? c.email ?? undefined}
                  className={c.id === value ? 'bg-accent-soft' : undefined}
                />
              ))}
            </List>
            {clients.data && filtered.length === 0 && <p className="py-6 text-center text-sm text-ink-3">{t.clients.emptyFiltered}</p>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
