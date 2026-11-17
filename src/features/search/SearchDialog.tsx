import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Inbox, Layers, ListChecks, Search, User, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { Spinner } from '@/ui/Spinner';
import type { SearchHit } from '@/lib/types';

const ICONS = { client: User, order: ClipboardList, fabric: Layers, task: ListChecks, inquiry: Inbox };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { shop } = useShop();
  const navigate = useNavigate();
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const term = useDebounced(q.trim(), 200);

  const results = useQuery({
    queryKey: ['shop', shop.id, 'search', term],
    enabled: open && term.length >= 2,
    queryFn: async () => must(await supabase.rpc('search_shop', { p_shop: shop.id, p_query: term })) as SearchHit[],
    placeholderData: (prev) => prev,
  });
  const hits = term.length >= 2 ? (results.data ?? []) : [];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setQ('');
      setActive(0);
    }
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => setActive(0), [term]);

  const go = (hit: SearchHit) => {
    const path = {
      client: `/clients/${hit.id}`,
      order: `/orders/${hit.id}`,
      fabric: '/fabrics',
      task: '/tasks',
      inquiry: '/inbox',
    }[hit.kind];
    onClose();
    navigate(path);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={t.common.search}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 sm:mx-auto sm:mt-[12vh] sm:h-auto sm:max-w-xl"
    >
      {open && (
        <div className="flex h-full flex-col bg-surface pt-safe sm:h-auto sm:max-h-[70vh] sm:rounded-[var(--radius-card)] sm:shadow-float">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-5 shrink-0 text-ink-3" aria-hidden />
            <input
              autoFocus
              type="search"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="search-results"
              aria-activedescendant={hits[active] ? `hit-${active}` : undefined}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, hits.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter' && hits[active]) {
                  go(hits[active]);
                }
              }}
              placeholder={t.app.searchPlaceholder}
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
            />
            {results.isFetching && <Spinner className="size-4 text-ink-3" />}
            <button type="button" onClick={onClose} aria-label={t.common.close} className="rounded-full p-2 text-ink-2 hover:bg-sunken">
              <X className="size-5" />
            </button>
          </div>
          <ul id="search-results" role="listbox" className="flex-1 overflow-y-auto py-2">
            {term.length < 2 ? (
              <li className="px-4 py-6 text-center text-sm text-ink-3">{t.app.searchHint}</li>
            ) : hits.length === 0 && !results.isFetching ? (
              <li className="px-4 py-6 text-center text-sm text-ink-3">{t.app.noResults}</li>
            ) : (
              hits.map((hit, i) => {
                const Icon = ICONS[hit.kind];
                return (
                  <li key={`${hit.kind}-${hit.id}`} id={`hit-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onClick={() => go(hit)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left ${i === active ? 'bg-sunken' : ''}`}
                    >
                      <Icon className="size-5 shrink-0 text-ink-3" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{hit.title}</span>
                        {hit.subtitle && <span className="block truncate text-sm text-ink-3">{hit.subtitle}</span>}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </dialog>
  );
}
