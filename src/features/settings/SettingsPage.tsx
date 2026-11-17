import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, ExternalLink, LogOut, Trash2, UserPlus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop, useShopContext, membershipsKey } from '@/features/shop/ShopProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { Page } from '@/ui/Page';
import { Section } from '@/ui/Card';
import { Button, IconButton } from '@/ui/Button';
import { SelectField, Switch, TextField } from '@/ui/Field';
import { List, Row, Avatar } from '@/ui/List';
import { Badge } from '@/ui/Badge';
import { useFeedback } from '@/ui/Feedback';
import { describeError } from '@/lib/errors';
import { copyText, dateStamp, downloadJson } from '@/lib/download';
import { isEmail, isOrderPrefix } from '@/domain/validation';
import type { Role, Shop } from '@/lib/types';
import {
  auditQuery,
  createInvite,
  deleteShop,
  exportShop,
  invitesQuery,
  keepClient,
  membersQuery,
  removeMember,
  retentionPreviewQuery,
  revokeInvite,
  setMemberRole,
  updateShop,
  type ShopPatch,
} from './api';

const RETENTION_CHOICES = [12, 24, 36, 60, 120];

export function SettingsPage() {
  const { shop, isOwner } = useShop();
  const { memberships, selectShop } = useShopContext();
  const { t } = useI18n();

  return (
    <Page title={t.settings.title} subtitle={shop.name} back="/more">
      <div className="flex flex-col gap-8">
        {memberships.length > 1 && (
          <Section title={t.app.switchShop} flush>
            <List>
              {memberships.map((m) => (
                <Row
                  key={m.shop.id}
                  onClick={() => selectShop(m.shop.id)}
                  title={m.shop.name}
                  subtitle={t.roles[m.role]}
                  trailing={m.shop.id === shop.id ? <Badge tone="accent">✓</Badge> : undefined}
                />
              ))}
            </List>
          </Section>
        )}
        {!isOwner && <p className="rounded-[var(--radius-control)] bg-sunken px-4 py-3 text-sm text-ink-2">{t.settings.ownerOnly}</p>}
        <ProfileSection key={shop.id} shop={shop} editable={isOwner} />
        <PublicSection shop={shop} editable={isOwner} />
        <TeamSection />
        <RetentionSection shop={shop} editable={isOwner} />
        {isOwner && <DataSection shop={shop} />}
      </div>
    </Page>
  );
}

function useSaveShop() {
  const { shop } = useShop();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useFeedback();
  const queryClient = useQueryClient();
  return async (patch: ShopPatch, quiet = false) => {
    try {
      await updateShop(shop.id, patch);
      await queryClient.invalidateQueries({ queryKey: membershipsKey(user?.id) });
      if (!quiet) toast(t.common.saved);
      return true;
    } catch (err) {
      toast(describeError(err, t), 'error');
      return false;
    }
  };
}

function ProfileSection({ shop, editable }: { shop: Shop; editable: boolean }) {
  const { t } = useI18n();
  const save = useSaveShop();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: shop.name,
    legal_name: shop.legal_name ?? '',
    org_number: shop.org_number ?? '',
    address: shop.address ?? '',
    phone: shop.phone ?? '',
    email: shop.email ?? '',
    opening_hours: shop.opening_hours ?? '',
    privacy_contact_email: shop.privacy_contact_email ?? '',
    order_prefix: shop.order_prefix,
  });
  const field = (key: keyof typeof form) => ({
    value: form[key],
    disabled: !editable,
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });
  const emailBad = (v: string) => (v.trim() && !isEmail(v) ? t.clients.invalidEmail : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !isOrderPrefix(form.order_prefix) || emailBad(form.email) || emailBad(form.privacy_contact_email)) return;
    setBusy(true);
    const clean = (v: string) => v.trim() || null;
    await save({
      name: form.name.trim(),
      legal_name: clean(form.legal_name),
      org_number: clean(form.org_number),
      address: clean(form.address),
      phone: clean(form.phone),
      email: clean(form.email),
      opening_hours: clean(form.opening_hours),
      privacy_contact_email: clean(form.privacy_contact_email),
      order_prefix: form.order_prefix,
    });
    setBusy(false);
  };

  return (
    <Section title={t.settings.profile} description={t.settings.profileHelp}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.setup.shopName} maxLength={120} {...field('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.settings.legalName} optional={t.common.optional} maxLength={160} {...field('legal_name')} />
          <TextField label={t.settings.orgNumber} optional={t.common.optional} maxLength={32} {...field('org_number')} />
        </div>
        <TextField label={t.settings.address} optional={t.common.optional} maxLength={300} autoComplete="street-address" {...field('address')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.settings.phone} type="tel" optional={t.common.optional} maxLength={40} {...field('phone')} />
          <TextField label={t.settings.email} type="email" optional={t.common.optional} maxLength={254} error={emailBad(form.email)} {...field('email')} />
        </div>
        <TextField label={t.settings.openingHours} optional={t.common.optional} placeholder={t.settings.openingHoursPlaceholder} maxLength={300} {...field('opening_hours')} />
        <TextField
          label={t.settings.privacyEmail}
          type="email"
          optional={t.common.optional}
          maxLength={254}
          error={emailBad(form.privacy_contact_email)}
          {...field('privacy_contact_email')}
        />
        <TextField
          label={t.settings.orderPrefix}
          {...field('order_prefix')}
          onChange={(e) => setForm({ ...form, order_prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) })}
          error={!isOrderPrefix(form.order_prefix) ? t.setup.prefixInvalid : null}
        />
        {editable && (
          <Button type="submit" loading={busy} className="self-start">
            {t.common.save}
          </Button>
        )}
      </form>
    </Section>
  );
}

function PublicSection({ shop, editable }: { shop: Shop; editable: boolean }) {
  const { t } = useI18n();
  const save = useSaveShop();
  return (
    <Section id="public" title={t.settings.publicPage} description={t.settings.publicPageHelp}>
      <div className="flex flex-col gap-4">
        <Switch
          checked={shop.inquiries_enabled}
          disabled={!editable}
          onChange={(v) => save({ inquiries_enabled: v })}
          label={t.settings.inquiriesEnabled}
        />
        <Link to={`/s/${shop.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
          <ExternalLink className="size-4" /> {t.settings.openPublicPage}
        </Link>
      </div>
    </Section>
  );
}

function TeamSection() {
  const { shop, isOwner } = useShop();
  const { user } = useAuth();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const members = useQuery(membersQuery(shop.id));
  const invites = useQuery({ ...invitesQuery(shop.id), enabled: isOwner });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [busy, setBusy] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
  const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return;
    setBusy(true);
    try {
      const created = await createInvite(shop.id, email, role);
      setEmail('');
      await copyText(inviteUrl(created.token));
      toast(t.settings.inviteCreated);
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Section title={t.settings.team} flush>
      <List>
        {(members.data ?? []).map((m) => {
          const self = m.user_id === user?.id;
          const name = m.full_name || '—';
          return (
            <Row
              key={m.user_id}
              leading={<Avatar name={name} className="size-9" />}
              title={self ? `${name} (${t.settings.you})` : name}
              subtitle={t.roles[m.role]}
              trailing={
                isOwner && !self ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => run(() => setMemberRole(shop.id, m.user_id, m.role === 'owner' ? 'staff' : 'owner'))}>
                      {m.role === 'owner' ? t.settings.makeStaff : t.settings.makeOwner}
                    </Button>
                    <IconButton
                      size="sm"
                      tone="danger"
                      label={t.settings.remove}
                      onClick={async () => {
                        if (await confirm({ title: t.settings.removeConfirm(name), danger: true, confirmLabel: t.settings.remove }))
                          run(() => removeMember(shop.id, m.user_id));
                      }}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </>
                ) : self ? (
                  <IconButton
                    size="sm"
                    label={t.settings.leave}
                    onClick={async () => {
                      if (!(await confirm({ title: t.settings.leave, body: t.settings.leaveConfirm, danger: true, confirmLabel: t.settings.leave }))) return;
                      try {
                        await removeMember(shop.id, m.user_id);
                        await queryClient.invalidateQueries({ queryKey: membershipsKey(user?.id) });
                        navigate('/', { replace: true });
                      } catch (err) {
                        toast(describeError(err, t), 'error');
                      }
                    }}
                  >
                    <LogOut className="size-4" />
                  </IconButton>
                ) : undefined
              }
            />
          );
        })}
      </List>

      {isOwner && (
        <div className="flex flex-col gap-4 border-t border-line p-4">
          {(invites.data?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-ink-2">{t.settings.pendingInvites}</h3>
              <ul className="flex flex-col gap-2">
                {invites.data!.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-2 rounded-[var(--radius-control)] bg-sunken py-1.5 pl-3 pr-1">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-ink-3">
                        {t.roles[inv.role]} · {t.settings.expires(fmt.day(inv.expires_at))}
                      </p>
                    </div>
                    <IconButton size="sm" label={t.settings.inviteLink} onClick={async () => (await copyText(inviteUrl(inv.token))) && toast(t.common.copied)}>
                      <Copy className="size-4" />
                    </IconButton>
                    <IconButton size="sm" tone="danger" label={t.settings.revoke} onClick={() => run(() => revokeInvite(inv.id))}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end" noValidate>
            <TextField label={t.settings.inviteEmail} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            <SelectField
              label={t.settings.inviteRole}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              options={(['staff', 'owner'] as const).map((r) => ({ value: r, label: t.roles[r] }))}
            />
            <Button type="submit" icon={<UserPlus className="size-4" />} loading={busy} disabled={!isEmail(email)} className="h-12">
              {t.settings.invite}
            </Button>
          </form>
        </div>
      )}
    </Section>
  );
}

function RetentionSection({ shop, editable }: { shop: Shop; editable: boolean }) {
  const { t, fmt } = useI18n();
  const { toast } = useFeedback();
  const save = useSaveShop();
  const queryClient = useQueryClient();
  const preview = useQuery(retentionPreviewQuery(shop.id));

  return (
    <Section title={t.settings.retention} description={t.settings.retentionHelp}>
      <div className="flex flex-col gap-5">
        <SelectField
          label={t.settings.retentionMonths}
          value={String(shop.client_retention_months)}
          disabled={!editable}
          onChange={(e) => save({ client_retention_months: Number(e.target.value) }).then(() => preview.refetch())}
          options={[...new Set([...RETENTION_CHOICES, shop.client_retention_months])]
            .sort((a, b) => a - b)
            .map((m) => ({ value: String(m), label: t.settings.months(m) }))}
        />
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-2">{t.settings.upcomingDeletions}</h3>
          {preview.data && preview.data.length > 0 ? (
            <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
              {preview.data.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <Link to={`/clients/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-ink-3">{fmt.date(c.deletes_on)}</span>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    title={t.settings.keepHelp}
                    onClick={async () => {
                      try {
                        await keepClient(c.id);
                        queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
                      } catch (err) {
                        toast(describeError(err, t), 'error');
                      }
                    }}
                  >
                    {t.settings.keep}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">{t.settings.noUpcoming}</p>
          )}
        </div>
      </div>
    </Section>
  );
}

function DataSection({ shop }: { shop: Shop }) {
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const audit = useQuery(auditQuery(shop.id));
  const members = useQuery(membersQuery(shop.id));
  const names = new Map((members.data ?? []).map((m) => [m.user_id, m.full_name]));

  const doExport = async () => {
    try {
      downloadJson(await exportShop(shop.id), `${shop.slug}-export-${dateStamp()}.json`);
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const doDelete = async () => {
    const ok = await confirm({
      title: t.settings.dangerZone,
      body: t.settings.deleteShopHelp,
      danger: true,
      confirmLabel: t.common.delete,
      typeToConfirm: t.settings.deleteShopConfirm,
    });
    if (!ok) return;
    try {
      await deleteShop(shop.id);
      await queryClient.invalidateQueries({ queryKey: membershipsKey(user?.id) });
      navigate('/', { replace: true });
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <>
      <Section title={t.settings.dataTools}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={doExport} className="self-start">
              {t.settings.exportShop}
            </Button>
            <p className="text-xs text-ink-3">{t.settings.exportShopHelp}</p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-ink-2">{t.settings.dpa}</h3>
            <p className="text-sm text-ink-3">{t.settings.dpaHelp}</p>
            <Link to="/terms#dpa" target="_blank" className="text-sm font-medium text-accent hover:underline">
              {t.settings.readTerms}
            </Link>
          </div>
        </div>
      </Section>

      <Section title={t.settings.auditLog} description={t.settings.auditHelp} flush>
        {audit.data && audit.data.length > 0 ? (
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {audit.data.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0">
                  <strong className="font-medium">
                    {a.actor ? names.get(a.actor) || t.settings.removedUser : t.settings.systemActor}
                  </strong>{' '}
                  <span className="text-ink-2">
                    {t.settings.auditActions[a.action]} {t.settings.auditEntities[a.entity] ?? a.entity}
                  </span>
                  {a.changed?.length ? <span className="text-ink-3"> ({a.changed.join(', ')})</span> : null}
                </span>
                <time className="tabular shrink-0 text-xs text-ink-3" dateTime={a.at}>
                  {fmt.dateTime(a.at)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-ink-3">{t.settings.auditEmpty}</p>
        )}
      </Section>

      <Section title={t.settings.dangerZone}>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-3">{t.settings.deleteShopHelp}</p>
          <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={doDelete} className="self-start">
            {t.settings.dangerZone}
          </Button>
        </div>
      </Section>
    </>
  );
}
