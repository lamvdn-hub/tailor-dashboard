import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { useI18n, LOCALES, type Locale } from '@/i18n';
import { useTheme, type ThemePref } from '@/app/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useShopContext } from '@/features/shop/ShopProvider';
import { membersQuery } from '@/features/settings/api';
import { Page } from '@/ui/Page';
import { Section } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Field';
import { Segmented } from '@/ui/Segmented';
import { useFeedback } from '@/ui/Feedback';
import { supabase } from '@/lib/supabase';
import { describeError, errorCode } from '@/lib/errors';
import { dateStamp, downloadJson } from '@/lib/download';
import { clearDeviceData } from '@/lib/prefs';
import { queryClient } from '@/app/queryClient';
import { isStrongPassword } from '@/domain/validation';
import { deleteMyAccount, exportMyData, profileQuery, updateProfile } from './api';

export function AccountPage() {
  const { user, signOut } = useAuth();
  const { memberships } = useShopContext();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const profile = useQuery(profileQuery(user!.id));
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const currentName = name ?? profile.data?.full_name ?? '';

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('name');
    try {
      await updateProfile(user!.id, { full_name: currentName.trim() });
      await profile.refetch();
      toast(t.common.saved);
    } catch (err) {
      toast(describeError(err, t), 'error');
    } finally {
      setBusy(null);
    }
  };

  const changeLocale = (l: Locale) => {
    setLocale(l);
    void updateProfile(user!.id, { locale: l }).catch(() => undefined);
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(password)) return;
    setBusy('password');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return toast(describeError(error, t), 'error');
    setPassword('');
    toast(t.account.passwordChanged);
  };

  const doExport = async () => {
    try {
      downloadJson(await exportMyData(), `my-data-${dateStamp()}.json`);
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const doDelete = async () => {
    const ok = await confirm({
      title: t.account.deleteAccount,
      body: t.account.deleteAccountHelp,
      danger: true,
      confirmLabel: t.common.delete,
      typeToConfirm: t.account.deleteAccountConfirm,
    });
    if (!ok) return;
    try {
      // Shops where this user is the only member are erased with the account.
      const sole: string[] = [];
      for (const m of memberships.filter((x) => x.role === 'owner')) {
        const members = await queryClient.fetchQuery(membersQuery(m.shop.id));
        if (members.length === 1) sole.push(m.shop.id);
      }
      await deleteMyAccount(sole);
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      toast(errorCode(err) === 'transfer_ownership_required' ? t.account.transferFirst : describeError(err, t), 'error');
    }
  };

  return (
    <Page title={t.account.title} back="/more">
      <div className="flex flex-col gap-8">
        <Section title={t.account.profile}>
          <form onSubmit={saveName} className="flex flex-col gap-4">
            <TextField label={t.account.email} value={user?.email ?? ''} disabled readOnly />
            <TextField label={t.account.name} value={currentName} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} />
            <Button type="submit" loading={busy === 'name'} className="self-start">
              {t.common.save}
            </Button>
          </form>
        </Section>

        <Section title={t.account.preferences}>
          <div className="flex flex-col gap-5">
            <Segmented label={t.language.label} value={locale} options={LOCALES.map((l) => ({ value: l, label: t.language[l] }))} onChange={changeLocale} />
            <Segmented
              label={t.theme.label}
              value={theme}
              options={(['system', 'light', 'dark'] as ThemePref[]).map((v) => ({ value: v, label: t.theme[v] }))}
              onChange={setTheme}
            />
          </div>
        </Section>

        <Section title={t.account.changePassword}>
          <form onSubmit={changePassword} className="flex flex-col gap-4" noValidate>
            <TextField
              label={t.auth.newPassword}
              type="password"
              autoComplete="new-password"
              value={password}
              hint={t.auth.passwordRule}
              error={password && !isStrongPassword(password) ? t.auth.passwordRule : null}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="secondary" loading={busy === 'password'} disabled={!isStrongPassword(password)} className="self-start">
              {t.account.changePassword}
            </Button>
          </form>
        </Section>

        <Section title={t.account.privacy}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <Button variant="secondary" icon={<Download className="size-4" />} onClick={doExport} className="self-start">
                {t.account.exportMine}
              </Button>
              <p className="text-xs text-ink-3">{t.account.exportMineHelp}</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-ink-2">{t.account.deviceStorage}</h3>
              <p className="text-sm text-ink-3">{t.account.deviceStorageHelp}</p>
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={async () => {
                  await signOut();
                  clearDeviceData();
                  navigate('/login', { replace: true });
                }}
              >
                {t.account.clearDevice}
              </Button>
            </div>
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <Button variant="quiet-danger" icon={<Trash2 className="size-4" />} onClick={doDelete} className="self-start">
                {t.account.deleteAccount}
              </Button>
              <p className="text-xs text-ink-3">{t.account.deleteAccountHelp}</p>
            </div>
          </div>
        </Section>

        <Button variant="secondary" size="lg" icon={<LogOut className="size-4" />} onClick={() => signOut().then(() => navigate('/login', { replace: true }))}>
          {t.app.nav.signOut}
        </Button>
      </div>
    </Page>
  );
}
