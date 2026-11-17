import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Field';
import { isOrderPrefix, isSlug, slugify, suggestPrefix } from '@/domain/validation';
import { describeError, errorCode } from '@/lib/errors';
import { createShop } from '@/features/settings/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { membershipsKey, useShopContext } from './ShopProvider';

export function SetupPage() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { selectShop } = useShopContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [prefixEdited, setPrefixEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slugEdited ? slug : slugify(name);
  const effectivePrefix = prefixEdited ? prefix : suggestPrefix(name);
  const today = new Date();
  const example = `${effectivePrefix || 'ORD'}-${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSlugError(null);
    if (!name.trim()) return;
    if (!isSlug(effectiveSlug)) {
      setSlugError(t.setup.slugInvalid);
      return;
    }
    if (!isOrderPrefix(effectivePrefix)) return;
    setBusy(true);
    try {
      const shop = await createShop(name.trim(), effectiveSlug, effectivePrefix);
      selectShop(shop.id);
      await queryClient.invalidateQueries({ queryKey: membershipsKey(user?.id) });
      navigate('/', { replace: true });
    } catch (err) {
      if (errorCode(err) === 'duplicate') setSlugError(t.setup.slugTaken);
      else setError(describeError(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicFrame title={t.setup.title}>
      <div className="mb-6 mt-6 sm:mt-12">
        <h1 className="text-2xl font-semibold tracking-tight">{t.setup.title}</h1>
        <p className="mt-2 text-ink-2">{t.setup.intro}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.setup.shopName} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus />
        <TextField
          label={t.setup.slug}
          value={effectiveSlug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.toLowerCase());
          }}
          autoCapitalize="none"
          spellCheck={false}
          hint={t.setup.slugHelp(`${window.location.host}/s/${effectiveSlug || '…'}`)}
          error={slugError}
        />
        <TextField
          label={t.setup.prefix}
          value={effectivePrefix}
          onChange={(e) => {
            setPrefixEdited(true);
            setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
          }}
          autoCapitalize="characters"
          hint={isOrderPrefix(effectivePrefix) ? t.setup.prefixHelp(example) : undefined}
          error={effectivePrefix && !isOrderPrefix(effectivePrefix) ? t.setup.prefixInvalid : null}
        />
        {error && (
          <p role="alert" className="rounded-[var(--radius-control)] bg-danger-soft px-4 py-3 text-sm text-danger-ink">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={busy} disabled={!name.trim()}>
          {t.setup.create}
        </Button>
        <p className="text-sm text-ink-3">{t.setup.waitingInvite}</p>
        <Button variant="ghost" onClick={() => signOut()}>
          {t.app.nav.signOut}
        </Button>
      </form>
    </PublicFrame>
  );
}
