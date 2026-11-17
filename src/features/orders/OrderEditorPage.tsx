import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCopy, Footprints, ImagePlus, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Section } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { SelectField, TextAreaField, TextField } from '@/ui/Field';
import { Segmented } from '@/ui/Segmented';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { GARMENTS, SERVICES, hasJacket, workflowFor } from '@/domain/orders';
import { completion, carryOver } from '@/domain/measurements';
import { balanceDue, formatMoney, parseMoney } from '@/domain/money';
import { describeError } from '@/lib/errors';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/image';
import { MAX_PHOTOS_PER_ORDER } from '@/lib/config';
import { ClientPicker } from '@/features/clients/ClientPicker';
import { fabricsQuery } from '@/features/fabrics/api';
import { MeasurementTable } from '@/features/measurements/MeasurementTable';
import { GuidedMeasure } from '@/features/measurements/GuidedMeasure';
import { createOrder, latestMeasurements, orderQuery, updateOrder } from './api';
import { uploadPhoto } from './photosApi';
import { emptyForm, formFromOrder, updateForm, validateForm, type OrderForm, type OrderFormErrors } from './form';
import { StyleFields } from './StyleFields';

const draftKey = (shopId: string) => `draft.order.${shopId}`;

function readDraft(shopId: string): OrderForm | null {
  try {
    const raw = sessionStorage.getItem(draftKey(shopId));
    return raw ? (JSON.parse(raw) as OrderForm) : null;
  } catch {
    return null;
  }
}

export function OrderEditorPage() {
  const { orderId } = useParams();
  const isNew = !orderId;
  const { shop } = useShop();
  const { t, locale } = useI18n();
  const existing = useQuery({ ...orderQuery(shop.id, orderId ?? ''), enabled: !isNew });

  if (!isNew && existing.isPending) return <PageSpinner label={t.common.loading} />;
  if (!isNew && !existing.data)
    return (
      <Page title={t.common.notFound} back="/orders">
        <p className="text-ink-2">{t.common.notFound}</p>
      </Page>
    );
  return <OrderEditor key={orderId ?? 'new'} initial={existing.data ? formFromOrder(existing.data, locale) : null} orderId={orderId} />;
}

function OrderEditor({ initial, orderId }: { initial: OrderForm | null; orderId?: string }) {
  const isNew = !orderId;
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const fabrics = useQuery(fabricsQuery(shop.id));

  const [form, setForm] = useState<OrderForm>(() => {
    if (initial) return initial;
    const draft = readDraft(shop.id);
    const preset = params.get('client');
    if (draft && (!preset || draft.clientId === preset)) return draft;
    return emptyForm(preset ?? '');
  });
  const restoredDraft = useRef(isNew && readDraft(shop.id) !== null);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [busy, setBusy] = useState(false);
  const [guided, setGuided] = useState(false);
  const [photos, setPhotos] = useState<Array<{ file: File; url: string }>>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restoredDraft.current) toast(t.orders.draftRestored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave new-order drafts for this tab only (sessionStorage).
  useEffect(() => {
    if (!isNew) return;
    try {
      sessionStorage.setItem(draftKey(shop.id), JSON.stringify(form));
    } catch {
      // Draft just won't survive a reload.
    }
  }, [form, isNew, shop.id]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const set = (patch: Partial<OrderForm>) => setForm((f) => updateForm(f, patch));
  const progress = completion(form.garment, form.measurements);
  const isSuit = form.garment === 'suit';

  const fabricOptions = useMemo(
    () =>
      (fabrics.data ?? [])
        .filter((f) => f.in_stock || f.id === form.fabricId)
        .map((f) => ({ value: f.id, label: f.code ? `${f.name} · ${f.code}` : f.name })),
    [fabrics.data, form.fabricId],
  );

  const copyLatest = async () => {
    if (!form.clientId) {
      setErrors({ clientId: 'required' });
      return;
    }
    try {
      const latest = await latestMeasurements(form.clientId, orderId);
      if (!latest) return toast(t.orders.noPrevious, 'error');
      if (Object.keys(form.measurements).length && !(await confirm({ title: t.orders.overwriteConfirm }))) return;
      set({ measurements: carryOver(latest.measurements, form.garment) });
      toast(t.orders.copiedFrom(latest.number));
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const discardDraft = () => {
    sessionStorage.removeItem(draftKey(shop.id));
    setForm(emptyForm(params.get('client') ?? ''));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { input, errors: errs } = validateForm(form);
    setErrors(errs);
    if (!input) return;
    setBusy(true);
    try {
      if (isNew) {
        const order = await createOrder(shop.id, input);
        sessionStorage.removeItem(draftKey(shop.id));
        let failed = 0;
        for (const p of photos) {
          try {
            await uploadPhoto(shop.id, order.id, p.file);
          } catch {
            failed++;
          }
        }
        if (failed) toast(t.orders.uploadFailed(String(failed)), 'error');
        toast(t.orders.created_ok(order.number));
        await queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
        navigate(`/orders/${order.id}`, { replace: true });
      } else {
        await updateOrder(orderId!, input);
        await queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
        toast(t.common.saved);
        navigate(`/orders/${orderId}`, { replace: true });
      }
    } catch (err) {
      toast(describeError(err, t), 'error');
      setBusy(false);
    }
  };

  const price = parseMoney(form.price);
  const deposit = parseMoney(form.deposit) ?? 0;
  const balance = typeof price === 'number' && typeof deposit === 'number' ? balanceDue(price, deposit) : null;
  const moneyError = (code: OrderFormErrors['price']) =>
    code === 'invalid' ? t.orders.invalidAmount : code === 'depositTooHigh' ? t.orders.depositTooHigh : null;

  return (
    <Page
      title={isNew ? t.orders.new : t.orders.editTitle}
      back={isNew ? '/orders' : `/orders/${orderId}`}
      actions={
        isNew && restoredDraft.current ? (
          <Button variant="ghost" size="sm" onClick={discardDraft}>
            {t.orders.discardDraft}
          </Button>
        ) : undefined
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <Section title={t.orders.details}>
          <div className="flex flex-col gap-4">
            <ClientPicker
              shopId={shop.id}
              value={form.clientId}
              onChange={(clientId) => set({ clientId })}
              error={errors.clientId ? t.common.required : null}
            />
            <Segmented label={t.orders.garment} value={form.garment} options={GARMENTS.map((g) => ({ value: g, label: t.garment[g] }))} onChange={(garment) => set({ garment })} />
            <Segmented label={t.orders.service} value={form.service} options={SERVICES.map((s) => ({ value: s, label: t.service[s] }))} onChange={(service) => set({ service })} />
            {!isNew && (
              <SelectField
                label={t.orders.status}
                value={form.status}
                onChange={(e) => set({ status: e.target.value as OrderForm['status'] })}
                options={workflowFor(form.service).map((s) => ({ value: s, label: t.status[s] }))}
              />
            )}
            <SelectField
              label={t.orders.fabric}
              optional={t.common.optional}
              value={form.fabricId}
              onChange={(e) => set({ fabricId: e.target.value })}
              placeholder={t.orders.noFabric}
              options={fabricOptions}
            />
            <TextField label={t.orders.dueDate} optional={t.common.optional} type="date" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </div>
        </Section>

        {hasJacket(form.garment) && (
          <Section title={t.orders.style}>
            <StyleFields value={form.style} onChange={(style) => set({ style })} />
          </Section>
        )}

        <Section
          id="measurements"
          title={t.measurements.title}
          description={t.measurements.progress(progress.done, progress.total)}
        >
          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            <Button icon={<Footprints className="size-4" />} onClick={() => setGuided(true)}>
              {t.measurements.guided}
            </Button>
            <Button variant="secondary" icon={<ClipboardCopy className="size-4" />} onClick={copyLatest}>
              {t.orders.copyFromLatest}
            </Button>
          </div>
          <MeasurementTable garment={form.garment} values={form.measurements} onChange={(measurements) => set({ measurements })} />
        </Section>

        <Section title={t.orders.notes}>
          <div className="flex flex-col gap-4">
            {isSuit ? (
              <>
                <TextAreaField label={t.orders.jacketNotes} value={form.jacketNotes} maxLength={4000} onChange={(e) => set({ jacketNotes: e.target.value })} />
                <TextAreaField label={t.orders.trousersNotes} value={form.trousersNotes} maxLength={4000} onChange={(e) => set({ trousersNotes: e.target.value })} />
              </>
            ) : (
              <TextAreaField label={t.orders.styleNotes} value={form.styleNotes} maxLength={4000} onChange={(e) => set({ styleNotes: e.target.value })} />
            )}
            <TextAreaField label={t.orders.clientRequests} value={form.clientRequests} maxLength={4000} onChange={(e) => set({ clientRequests: e.target.value })} />
            <TextAreaField label={t.orders.adjustmentNotes} value={form.adjustmentNotes} maxLength={4000} onChange={(e) => set({ adjustmentNotes: e.target.value })} />
          </div>
        </Section>

        <Section title={t.orders.pricing}>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t.orders.price}
              inputMode="decimal"
              value={form.price}
              suffix={shop.currency}
              error={moneyError(errors.price)}
              onChange={(e) => set({ price: e.target.value })}
            />
            <TextField
              label={t.orders.deposit}
              inputMode="decimal"
              value={form.deposit}
              suffix={shop.currency}
              error={moneyError(errors.deposit)}
              onChange={(e) => set({ deposit: e.target.value })}
            />
          </div>
          {balance !== null && (
            <p className="tabular mt-3 text-sm text-ink-2">
              {t.orders.balance}: <strong className="text-ink">{formatMoney(balance, shop.currency, fmt.intl)}</strong>
            </p>
          )}
        </Section>

        {isNew && (
          <Section title={t.orders.photos} description={t.orders.photoHint}>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_PER_ORDER - photos.length);
                setPhotos((list) => [...list, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
                e.target.value = '';
              }}
            />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl bg-sunken">
                  <img src={p.url} alt={t.orders.photoOf(i + 1, photos.length)} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={t.common.delete}
                    onClick={() => setPhotos((list) => list.filter((x) => x !== p))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS_PER_ORDER && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong text-sm text-ink-3 hover:text-ink-2"
                >
                  <ImagePlus className="size-6" aria-hidden />
                  {t.orders.addPhotos}
                </button>
              )}
            </div>
          </Section>
        )}

        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 lg:bottom-0">
          <div className="flex gap-2 sm:justify-end">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => navigate(-1)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" className="flex-[2] sm:flex-none" loading={busy}>
              {isNew ? t.orders.new : t.common.save}
            </Button>
          </div>
        </div>
      </form>

      <GuidedMeasure
        open={guided}
        onClose={() => setGuided(false)}
        garment={form.garment}
        values={form.measurements}
        onChange={(measurements) => set({ measurements })}
      />
    </Page>
  );
}
