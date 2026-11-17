import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { Button } from '@/ui/Button';
import { Checkbox, TextField } from '@/ui/Field';
import { isEmail, isStrongPassword } from '@/domain/validation';
import { describeError } from '@/lib/errors';
import { APP_NAME } from '@/lib/config';
import { useAuth } from './AuthProvider';

function Heading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-6 mt-6 sm:mt-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {intro && <p className="mt-2 text-[0.9375rem] text-ink-2">{intro}</p>}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--radius-control)] bg-danger-soft px-4 py-3 text-sm text-danger-ink">
      {message}
    </p>
  );
}

/** Where to go after signing in: ?next= if it is a safe in-app path. */
function useNextPath(): string {
  const [params] = useSearchParams();
  const next = params.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const next = useNextPath();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(
        /confirm/i.test(err.message)
          ? t.auth.emailNotConfirmed
          : err.status === 400
            ? t.auth.invalidCredentials
            : describeError(err, t),
      );
      return;
    }
    navigate(next, { replace: true });
  };

  return (
    <PublicFrame title={t.auth.signIn}>
      <Heading title={APP_NAME} intro={t.auth.tagline} />
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.auth.email} type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label={t.auth.password} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormError message={error} />
        <Button type="submit" size="lg" loading={busy} disabled={!email || !password}>
          {t.auth.signIn}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link to="/forgot" className="font-medium text-accent hover:underline">
            {t.auth.forgot}
          </Link>
          <span className="text-ink-3">
            {t.auth.noAccount}{' '}
            <Link to={`/signup${location.search}`} className="font-medium text-accent hover:underline">
              {t.auth.signUp}
            </Link>
          </span>
        </div>
      </form>
    </PublicFrame>
  );
}

export function SignupPage() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const next = useNextPath();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailError = touched && !isEmail(email) ? t.clients.invalidEmail : null;
  const passwordError = touched && !isStrongPassword(password) ? t.auth.passwordRule : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isEmail(email) || !isStrongPassword(password)) return;
    if (!accepted) {
      setError(t.auth.mustAccept);
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), locale, terms_accepted_at: new Date().toISOString() },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });
    setBusy(false);
    if (err) {
      setError(describeError(err, t));
      return;
    }
    if (!data.session) setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <PublicFrame title={t.auth.checkEmail}>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-10 text-accent" aria-hidden />
          <h1 className="text-2xl font-semibold">{t.auth.checkEmail}</h1>
          <p className="text-ink-2">{t.auth.confirmSent(sentTo)}</p>
        </div>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame title={t.auth.signUp}>
      <Heading title={t.auth.signUp} intro={t.auth.tagline} />
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.auth.fullName} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        <TextField label={t.auth.email} type="email" autoComplete="email" inputMode="email" value={email} error={emailError} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label={t.auth.password}
          type="password"
          autoComplete="new-password"
          value={password}
          hint={t.auth.passwordRule}
          error={passwordError}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Checkbox
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          label={
            <>
              {t.auth.acceptTerms('{terms}', '{privacy}').split(/(\{terms\}|\{privacy\})/).map((part, i) =>
                part === '{terms}' ? (
                  <Link key={i} to="/terms" target="_blank" className="font-medium text-accent underline">
                    {t.auth.terms}
                  </Link>
                ) : part === '{privacy}' ? (
                  <Link key={i} to="/privacy" target="_blank" className="font-medium text-accent underline">
                    {t.auth.privacyPolicy}
                  </Link>
                ) : (
                  part
                ),
              )}
            </>
          }
        />
        <FormError message={error} />
        <Button type="submit" size="lg" loading={busy}>
          {t.auth.signUp}
        </Button>
        <p className="text-center text-sm text-ink-3">
          {t.auth.haveAccount}{' '}
          <Link to={`/login${location.search}`} className="font-medium text-accent hover:underline">
            {t.auth.signIn}
          </Link>
        </p>
      </form>
    </PublicFrame>
  );
}

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return;
    setBusy(true);
    // The response is the same whether or not the address exists.
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset` });
    setBusy(false);
    setSent(true);
  };

  return (
    <PublicFrame title={t.auth.resetTitle}>
      <Heading title={t.auth.resetTitle} intro={sent ? undefined : t.auth.resetIntro} />
      {sent ? (
        <p role="status" className="rounded-[var(--radius-control)] bg-ok-soft px-4 py-3 text-ok-ink">
          {t.auth.resetSent}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField label={t.auth.email} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" loading={busy} disabled={!isEmail(email)}>
            {t.auth.sendLink}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </PublicFrame>
  );
}

export function ResetPasswordPage() {
  const { t } = useI18n();
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isStrongPassword(password)) return;
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(describeError(err, t));
      return;
    }
    navigate('/', { replace: true, state: { flash: t.auth.passwordUpdated } });
  };

  return (
    <PublicFrame title={t.auth.chooseNew}>
      <Heading title={t.auth.chooseNew} />
      {ready && !session ? (
        <div className="flex flex-col gap-4">
          <FormError message={t.auth.resetExpired} />
          <Link to="/forgot" className="font-medium text-accent hover:underline">
            {t.auth.resetTitle}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t.auth.newPassword}
            type="password"
            autoComplete="new-password"
            value={password}
            hint={t.auth.passwordRule}
            error={touched && !isStrongPassword(password) ? t.auth.passwordRule : null}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormError message={error} />
          <Button type="submit" size="lg" loading={busy}>
            {t.common.save}
          </Button>
        </form>
      )}
    </PublicFrame>
  );
}
