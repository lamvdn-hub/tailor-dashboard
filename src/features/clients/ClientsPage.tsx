import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { ButtonLink } from '@/ui/Button';
import { Avatar, EmptyState, List, Row } from '@/ui/List';
import { PageSpinner } from '@/ui/Spinner';
import { clientsQuery, fullName } from './api';

export function ClientsPage() {
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const clients = useQuery(clientsQuery(shop.id));
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (clients.data ?? []).filter(
      (c) => !needle || `${fullName(c)} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(needle),
    );
    const map = new Map<string, typeof list>();
    for (const c of list) {
      const letter = c.last_name.charAt(0).toLocaleUpperCase('sv') || '#';
      map.set(letter, [...(map.get(letter) ?? []), c]);
    }
    return [...map.entries()];
  }, [clients.data, q]);

  return (
    <Page
      title={t.clients.title}
      subtitle={clients.data ? fmt.number(clients.data.length) : undefined}
      actions={
        <ButtonLink to="/clients/new" variant="primary" size="sm" icon={<Plus className="size-4" />}>
          <span className="hidden sm:inline">{t.clients.new}</span>
        </ButtonLink>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.common.search}
            aria-label={t.common.search}
            className="h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-10 pr-3 text-base focus:border-accent focus:outline-none"
          />
        </div>
        {clients.isPending ? (
          <PageSpinner label={t.common.loading} />
        ) : groups.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users />}
              title={q ? t.clients.emptyFiltered : t.clients.empty}
              action={
                !q && (
                  <ButtonLink to="/clients/new" variant="primary" icon={<Plus className="size-4" />}>
                    {t.clients.new}
                  </ButtonLink>
                )
              }
            />
          </Card>
        ) : (
          groups.map(([letter, list]) => (
            <section key={letter} aria-label={letter}>
              <h2 className="mb-1 px-1 text-xs font-semibold text-ink-3">{letter}</h2>
              <Card className="overflow-hidden">
                <List>
                  {list.map((c) => (
                    <Row
                      key={c.id}
                      to={`/clients/${c.id}`}
                      leading={<Avatar name={fullName(c)} />}
                      title={`${c.last_name}, ${c.first_name}`}
                      subtitle={c.phone ?? c.email ?? undefined}
                    />
                  ))}
                </List>
              </Card>
            </section>
          ))
        )}
      </div>
    </Page>
  );
}
