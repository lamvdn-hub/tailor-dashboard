import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Section } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { TextAreaField, TextField } from '@/ui/Field';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { isEmail, isPhone } from '@/domain/validation';
import { describeError } from '@/lib/errors';
import type { Client } from '@/lib/types';
import { clientQuery, createClient, updateClient } from './api';

export function ClientEditorPage() {
  const { clientId } = useParams();
  const { shop } = useShop();
  const { t } = useI18n();
  const existing = useQuery({ ...clientQuery(shop.id, clientId ?? ''), enabled: Boolean(clientId) });
  if (clientId && existing.isPending) return <PageSpinner label={t.common.loading} />;
  return <ClientEditor key={clientId ?? 'new'} client={existing.data ?? null} />;
}

function ClientEditor({ client }: { client: Client | null }) {
  const { shop } = useShop();
  const { t } = useI18n();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Prefill from ?first=&last=&email=&phone= (e.g. "Create client" in the inbox).
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    first: client?.first_name ?? params.get('first') ?? '',
    last: client?.last_name ?? params.get('last') ?? '',
    phone: client?.phone ?? params.get('phone') ?? '',
    email: client?.email ?? params.get('email') ?? '',
    notes: client?.notes ?? '',
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = {
    first: touched && !form.first.trim() ? t.common.required : null,
    last: touched && !form.last.trim() ? t.common.required : null,
    phone: touched && form.phone.trim() && !isPhone(form.phone) ? t.clients.invalidPhone : null,
    email: touched && form.email.trim() && !isEmail(form.email) ? t.clients.invalidEmail : null,
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.first.trim() || !form.last.trim()) return;
    if ((form.phone.trim() && !isPhone(form.phone)) || (form.email.trim() && !isEmail(form.email))) return;
    setBusy(true);
    const input = {
      first_name: form.first.trim(),
      last_name: form.last.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (client) {
        await updateClient(client.id, input);
        toast(t.common.saved);
      } else {
        const created = await createClient(shop.id, input);
        toast(t.clients.created_ok);
        await queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
        navigate(`/clients/${created.id}`, { replace: true });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
      navigate(`/clients/${client.id}`, { replace: true });
    } catch (err) {
      toast(describeError(err, t), 'error');
      setBusy(false);
    }
  };

  return (
    <Page title={client ? t.clients.editTitle : t.clients.new} back={client ? `/clients/${client.id}` : '/clients'}>
      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <Section title={t.clients.title}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={t.clients.firstName} value={form.first} error={errors.first} maxLength={80} autoComplete="off" onChange={(e) => setForm({ ...form, first: e.target.value })} />
              <TextField label={t.clients.lastName} value={form.last} error={errors.last} maxLength={80} autoComplete="off" onChange={(e) => setForm({ ...form, last: e.target.value })} />
            </div>
            <TextField label={t.clients.phone} type="tel" inputMode="tel" optional={t.common.optional} value={form.phone} error={errors.phone} autoComplete="off" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label={t.clients.email} type="email" inputMode="email" optional={t.common.optional} value={form.email} error={errors.email} autoComplete="off" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextAreaField label={t.clients.notes} optional={t.common.optional} hint={t.clients.notesHelp} value={form.notes} maxLength={4000} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Section>
        <div className="flex gap-2 sm:justify-end">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => navigate(-1)}>
            {t.common.cancel}
          </Button>
          <Button type="submit" className="flex-[2] sm:flex-none" loading={busy}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Page>
  );
}
