import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { EmptyState, List, Row } from '@/ui/List';
import { Badge } from '@/ui/Badge';
import { Dialog } from '@/ui/Dialog';
import { Switch, TextAreaField, TextField } from '@/ui/Field';
import { FilterChips } from '@/ui/Segmented';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { describeError } from '@/lib/errors';
import type { Fabric } from '@/lib/types';
import { deleteFabric, fabricUsageQuery, fabricsQuery, saveFabric, type FabricInput } from './api';

export function FabricsPage() {
  const { shop } = useShop();
  const { t } = useI18n();
  const fabrics = useQuery(fabricsQuery(shop.id));
  const usage = useQuery(fabricUsageQuery(shop.id));
  const [q, setQ] = useState('');
  const [stock, setStock] = useState<'all' | 'in'>('all');
  const [editing, setEditing] = useState<Fabric | 'new' | null>(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (fabrics.data ?? []).filter(
      (f) =>
        (stock === 'all' || f.in_stock) &&
        (!needle || [f.name, f.code, f.composition, f.color_pattern].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [fabrics.data, q, stock]);

  return (
    <Page
      title={t.fabrics.title}
      back="/more"
      actions={
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
          <span className="hidden sm:inline">{t.fabrics.new}</span>
        </Button>
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
        <FilterChips
          label={t.fabrics.title}
          value={stock}
          onChange={setStock}
          options={[
            { value: 'all', label: t.common.all, count: fabrics.data?.length },
            { value: 'in', label: t.fabrics.filterInStock, count: fabrics.data?.filter((f) => f.in_stock).length },
          ]}
        />
        {fabrics.isPending ? (
          <PageSpinner label={t.common.loading} />
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState icon={<Layers />} title={t.fabrics.empty} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <List>
              {visible.map((f) => (
                <Row
                  key={f.id}
                  onClick={() => setEditing(f)}
                  title={f.name}
                  subtitle={[f.code, f.composition, f.color_pattern].filter(Boolean).join(' · ') || undefined}
                  trailing={
                    <>
                      {usage.data?.get(f.id) ? <span className="hidden text-xs text-ink-3 sm:inline">{t.fabrics.usedIn(usage.data.get(f.id)!)}</span> : null}
                      <Badge tone={f.in_stock ? 'ok' : 'neutral'}>{f.in_stock ? t.fabrics.inStock : t.fabrics.outOfStock}</Badge>
                    </>
                  }
                />
              ))}
            </List>
          </Card>
        )}
      </div>
      {editing && <FabricDialog fabric={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Page>
  );
}

function FabricDialog({ fabric, onClose }: { fabric: Fabric | null; onClose: () => void }) {
  const { shop } = useShop();
  const { t } = useI18n();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FabricInput>({
    name: fabric?.name ?? '',
    code: fabric?.code ?? '',
    composition: fabric?.composition ?? '',
    color_pattern: fabric?.color_pattern ?? '',
    in_stock: fabric?.in_stock ?? true,
    notes: fabric?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['shop', shop.id, 'fabrics'] });
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    const clean = (v: string | null) => v?.trim() || null;
    try {
      await saveFabric(
        shop.id,
        { ...form, name: form.name.trim(), code: clean(form.code), composition: clean(form.composition), color_pattern: clean(form.color_pattern), notes: clean(form.notes) },
        fabric?.id,
      );
      done();
    } catch (err) {
      toast(describeError(err, t), 'error');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!fabric || !(await confirm({ title: t.common.delete, body: t.fabrics.deleteConfirm(fabric.name), danger: true, confirmLabel: t.common.delete }))) return;
    try {
      await deleteFabric(fabric.id);
      done();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={fabric ? t.fabrics.editTitle : t.fabrics.new}
      footer={
        <>
          {fabric && (
            <Button variant="quiet-danger" icon={<Trash2 className="size-4" />} onClick={remove} className="sm:mr-auto">
              {t.common.delete}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="fabric-form" loading={busy} disabled={!form.name.trim()}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="fabric-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.fabrics.name} value={form.name} maxLength={120} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.fabrics.code} optional={t.common.optional} value={form.code ?? ''} maxLength={60} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <TextField label={t.fabrics.composition} optional={t.common.optional} value={form.composition ?? ''} maxLength={200} onChange={(e) => setForm({ ...form, composition: e.target.value })} />
        </div>
        <TextField label={t.fabrics.colorPattern} optional={t.common.optional} value={form.color_pattern ?? ''} maxLength={200} onChange={(e) => setForm({ ...form, color_pattern: e.target.value })} />
        <Switch checked={form.in_stock} onChange={(in_stock) => setForm({ ...form, in_stock })} label={t.fabrics.inStock} />
        <TextAreaField label={t.fabrics.notes} optional={t.common.optional} value={form.notes ?? ''} maxLength={2000} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </form>
    </Dialog>
  );
}
