import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Checkbox, TextAreaField, TextField } from '@/ui/Field';
import { PageSpinner } from '@/ui/Spinner';
import { isEmail } from '@/domain/validation';
import { ShopContactCard } from './TrackPage';
import { fetchPublicShop, submitInquiry, type SubmitResult } from './api';

export function ShopPage() {
  const { slug = '' } = useParams();
  const { t } = useI18n();
  const shop = useQuery({ queryKey: ['public-shop', slug], queryFn: () => fetchPublicShop(slug) });
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', ack: false, website: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (shop.isPending) return <PageSpinner label={t.common.loading} />;
  if (!shop.data)
    return (
      <PublicFrame title={t.shopPage.notFound}>
        <h1 className="mt-16 text-center text-xl font-semibold">{t.shopPage.notFound}</h1>
      </PublicFrame>
    );
  const s = shop.data;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (form.website) return setResult('ok'); // honeypot filled: silently drop
    if (!form.name.trim() || !isEmail(form.email) || !form.message.trim() || !form.ack) return;
    setBusy(true);
    setResult(await submitInquiry(slug, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim(), privacyAck: form.ack }));
    setBusy(false);
  };

  return (
    <PublicFrame title={s.name} brand={s.name}>
      <div className="mt-4 flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">{s.name}</h1>
        <ShopContactCard shop={s} />

        {s.inquiries_enabled && (
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">{t.shopPage.sendMessage}</h2>
            {result === 'ok' ? (
              <p role="status" className="flex items-center gap-2 text-ok-ink">
                <CheckCircle2 className="size-5" /> {t.shopPage.sent}
              </p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <TextField label={t.shopPage.name} autoComplete="name" maxLength={120} value={form.name} error={touched && !form.name.trim() ? t.common.required : null} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <TextField label={t.shopPage.email} type="email" inputMode="email" autoComplete="email" maxLength={254} value={form.email} error={touched && !isEmail(form.email) ? t.clients.invalidEmail : null} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <TextField label={t.shopPage.phone} type="tel" inputMode="tel" autoComplete="tel" optional={t.common.optional} maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <TextAreaField label={t.shopPage.message} rows={5} maxLength={4000} value={form.message} error={touched && !form.message.trim() ? t.common.required : null} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                {/* Honeypot for bots; hidden from people and assistive tech. */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                <Checkbox
                  checked={form.ack}
                  onChange={(e) => setForm({ ...form, ack: e.target.checked })}
                  label={
                    <>
                      {t.shopPage.privacyAck('{link}').split('{link}')[0]}
                      <Link to={`/s/${slug}/privacy`} target="_blank" className="font-medium text-accent underline">
                        {t.shopPage.privacyLink}
                      </Link>
                      {t.shopPage.privacyAck('{link}').split('{link}')[1]}
                    </>
                  }
                />
                {touched && !form.ack && <p className="text-sm text-danger-ink">{t.common.required}</p>}
                {result === 'rate_limited' && <p role="alert" className="text-sm text-danger-ink">{t.shopPage.rateLimited}</p>}
                {result === 'closed' && <p role="alert" className="text-sm text-danger-ink">{t.shopPage.closed}</p>}
                {result === 'error' && <p role="alert" className="text-sm text-danger-ink">{t.common.somethingWentWrong}</p>}
                <Button type="submit" size="lg" loading={busy}>
                  {t.shopPage.send}
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </PublicFrame>
  );
}
