import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckSquare, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { Button, IconButton } from '@/ui/Button';
import { FilterChips } from '@/ui/Segmented';
import { EmptyState } from '@/ui/List';
import { Badge } from '@/ui/Badge';
import { Dialog } from '@/ui/Dialog';
import { SelectField, TextAreaField, TextField } from '@/ui/Field';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { cn } from '@/lib/cn';
import { describeError } from '@/lib/errors';
import type { Task, TaskCategory, TaskPriority } from '@/lib/types';
import { clientsQuery, fullName } from '@/features/clients/api';
import { clientOrdersQuery } from '@/features/orders/api';
import { deleteTasks, isOverdue, saveTask, setTasksDone, tasksQuery, todayIso, type TaskInput } from './api';

type Filter = 'open' | 'today' | 'overdue' | 'done';
const CATEGORIES: TaskCategory[] = ['fitting', 'alteration', 'pickup', 'order', 'admin'];
const PRIORITIES: TaskPriority[] = ['high', 'normal', 'low'];

export function TasksPage() {
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const tasks = useQuery(tasksQuery(shop.id));
  const [filter, setFilter] = useState<Filter>('open');
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const today = todayIso();
  const all = useMemo(() => tasks.data ?? [], [tasks.data]);
  const counts = {
    open: all.filter((x) => !x.done_at).length,
    today: all.filter((x) => !x.done_at && x.due_date === today).length,
    overdue: all.filter((x) => isOverdue(x, today)).length,
    done: all.filter((x) => x.done_at).length,
  };
  const visible = useMemo(() => {
    const list = all.filter((x) =>
      filter === 'open' ? !x.done_at : filter === 'today' ? !x.done_at && x.due_date === today : filter === 'overdue' ? isOverdue(x, today) : Boolean(x.done_at),
    );
    const rank: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };
    return filter === 'done'
      ? list
      : [...list].sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || rank[a.priority] - rank[b.priority]);
  }, [all, filter, today]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });

  const toggle = async (task: Task) => {
    try {
      await setTasksDone([task.id], !task.done_at);
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const bulk = async (action: 'done' | 'delete') => {
    const ids = [...selected];
    if (action === 'delete' && !(await confirm({ title: t.tasks.deleteSelectedConfirm(ids.length), danger: true, confirmLabel: t.common.delete }))) return;
    try {
      if (action === 'done') await setTasksDone(ids, true);
      else await deleteTasks(ids);
      setSelected(new Set());
      setSelecting(false);
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Page
      title={t.tasks.title}
      actions={
        <>
          {visible.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => (setSelecting((s) => !s), setSelected(new Set()))} aria-pressed={selecting}>
              {selecting ? t.common.cancel : t.tasks.select}
            </Button>
          )}
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            <span className="hidden sm:inline">{t.tasks.new}</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FilterChips
          label={t.tasks.title}
          value={filter}
          onChange={setFilter}
          options={(Object.keys(counts) as Filter[]).map((f) => ({ value: f, label: t.tasks.filters[f], count: counts[f] }))}
        />
        {tasks.isPending ? (
          <PageSpinner label={t.common.loading} />
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState icon={<ListChecks />} title={t.tasks.empty} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {visible.map((task) => {
                const late = isOverdue(task, today);
                const isSel = selected.has(task.id);
                return (
                  <li key={task.id} className={cn('flex items-start gap-1 py-1.5 pl-1 pr-3', isSel && 'bg-accent-soft')}>
                    {selecting ? (
                      <label className="flex size-11 shrink-0 items-center justify-center">
                        <input
                          type="checkbox"
                          className="size-5 accent-[var(--accent)]"
                          checked={isSel}
                          aria-label={task.title}
                          onChange={() =>
                            setSelected((s) => {
                              const n = new Set(s);
                              if (n.has(task.id)) n.delete(task.id);
                              else n.add(task.id);
                              return n;
                            })
                          }
                        />
                      </label>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggle(task)}
                        aria-label={task.done_at ? t.tasks.markOpen : t.tasks.markDone}
                        aria-pressed={Boolean(task.done_at)}
                        className="flex size-11 shrink-0 items-center justify-center"
                      >
                        <span
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
                            task.done_at ? 'border-ok bg-ok text-white' : task.priority === 'high' ? 'border-danger' : 'border-line-strong',
                          )}
                        >
                          {task.done_at && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                      </button>
                    )}
                    <button type="button" onClick={() => setEditing(task)} className="min-w-0 flex-1 py-2 text-left">
                      <span className={cn('block text-[0.9375rem]', task.done_at ? 'text-ink-3 line-through' : 'text-ink')}>{task.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
                        <span className={late ? 'font-medium text-danger-ink' : undefined}>
                          {task.due_date ? fmt.relativeDay(task.due_date) : t.tasks.noDate}
                        </span>
                        <span>· {t.tasks.categories[task.category]}</span>
                        {task.client && <span>· {fullName(task.client)}</span>}
                        {task.order && <span>· {task.order.number}</span>}
                      </span>
                    </button>
                    {task.priority === 'high' && !task.done_at && (
                      <Badge tone="danger" className="mt-2.5">
                        {t.tasks.priorities.high}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {selecting && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-2xl bg-ink p-2 pl-4 text-canvas shadow-float">
            <span className="text-sm font-medium">{t.tasks.selected(selected.size)}</span>
            <Button size="sm" icon={<CheckSquare className="size-4" />} onClick={() => bulk('done')}>
              {t.tasks.completeSelected}
            </Button>
            <IconButton label={t.tasks.deleteSelected} onClick={() => bulk('delete')} className="text-canvas hover:bg-white/10">
              <Trash2 className="size-5" />
            </IconButton>
          </div>
        </div>
      )}

      {editing && (
        <TaskDialog
          task={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </Page>
  );
}

function TaskDialog({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: () => void }) {
  const { shop } = useShop();
  const { t } = useI18n();
  const { toast, confirm } = useFeedback();
  const clients = useQuery(clientsQuery(shop.id));
  const [form, setForm] = useState<TaskInput>({
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    category: task?.category ?? 'fitting',
    priority: task?.priority ?? 'normal',
    due_date: task?.due_date ?? todayIso(),
    client_id: task?.client_id ?? null,
    order_id: task?.order_id ?? null,
  });
  const [busy, setBusy] = useState(false);
  const orders = useQuery({ ...clientOrdersQuery(shop.id, form.client_id ?? ''), enabled: Boolean(form.client_id) });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await saveTask(shop.id, { ...form, title: form.title.trim(), notes: form.notes?.trim() || null, due_date: form.due_date || null }, task?.id);
      onSaved();
    } catch (err) {
      toast(describeError(err, t), 'error');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!task || !(await confirm({ title: t.tasks.deleteConfirm, danger: true, confirmLabel: t.common.delete }))) return;
    try {
      await deleteTasks([task.id]);
      onSaved();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={task ? t.tasks.editTitle : t.tasks.new}
      footer={
        <>
          {task && (
            <Button variant="quiet-danger" icon={<Trash2 className="size-4" />} onClick={remove} className="sm:mr-auto">
              {t.common.delete}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="task-form" loading={busy} disabled={!form.title.trim()}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.tasks.titleField} value={form.title} maxLength={300} autoFocus onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={t.tasks.category} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })} options={CATEGORIES.map((c) => ({ value: c, label: t.tasks.categories[c] }))} />
          <SelectField label={t.tasks.priority} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} options={PRIORITIES.map((p) => ({ value: p, label: t.tasks.priorities[p] }))} />
        </div>
        <TextField label={t.tasks.dueDate} type="date" optional={t.common.optional} value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value || null })} />
        <SelectField
          label={t.tasks.client}
          optional={t.common.optional}
          value={form.client_id ?? ''}
          placeholder={t.common.none}
          onChange={(e) => setForm({ ...form, client_id: e.target.value || null, order_id: null })}
          options={(clients.data ?? []).map((c) => ({ value: c.id, label: fullName(c) }))}
        />
        {form.client_id && (orders.data?.length ?? 0) > 0 && (
          <SelectField
            label={t.tasks.order}
            optional={t.common.optional}
            value={form.order_id ?? ''}
            placeholder={t.common.none}
            onChange={(e) => setForm({ ...form, order_id: e.target.value || null })}
            options={(orders.data ?? []).map((o) => ({ value: o.id, label: `${o.number} · ${t.garment[o.garment]}` }))}
          />
        )}
        <TextAreaField label={t.tasks.notes} optional={t.common.optional} value={form.notes ?? ''} maxLength={4000} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </form>
    </Dialog>
  );
}
