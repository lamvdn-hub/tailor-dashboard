import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { readPref, writePref } from '@/lib/prefs';
import type { Membership, Role, Shop } from '@/lib/types';
import { useAuth } from '@/features/auth/AuthProvider';

interface ShopValue {
  memberships: Membership[];
  loading: boolean;
  error: unknown;
  /** Active shop; null when the user has none yet. */
  shop: Shop | null;
  role: Role | null;
  isOwner: boolean;
  selectShop: (id: string) => void;
}

const ShopContext = createContext<ShopValue | null>(null);

export const membershipsKey = (userId: string | undefined) => ['memberships', userId] as const;

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(() => readPref('shop'));

  const query = useQuery({
    queryKey: membershipsKey(user?.id),
    enabled: Boolean(user),
    queryFn: async () => {
      const rows = must(
        await supabase
          .from('shop_members')
          .select('role, shop:shops(*)')
          .eq('user_id', user!.id)
          .order('created_at'),
      ) as unknown as Membership[];
      return rows.filter((m) => m.shop);
    },
  });

  const value = useMemo<ShopValue>(() => {
    const memberships = query.data ?? [];
    const active = memberships.find((m) => m.shop.id === selected) ?? memberships[0] ?? null;
    return {
      memberships,
      loading: query.isPending && Boolean(user),
      error: query.error,
      shop: active?.shop ?? null,
      role: active?.role ?? null,
      isOwner: active?.role === 'owner',
      selectShop: (id: string) => {
        setSelected(id);
        writePref('shop', id);
      },
    };
  }, [query.data, query.error, query.isPending, selected, user]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopContext(): ShopValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShopContext must be used inside ShopProvider');
  return ctx;
}

/** For pages rendered inside the shop layout, where a shop is guaranteed. */
export function useShop(): { shop: Shop; role: Role; isOwner: boolean } {
  const { shop, role, isOwner } = useShopContext();
  if (!shop || !role) throw new Error('useShop used outside a shop route');
  return { shop, role, isOwner };
}
