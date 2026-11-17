import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { Button, ButtonLink } from '@/ui/Button';
import { PageSpinner } from '@/ui/Spinner';
import { describeError } from '@/lib/errors';
import { acceptInvite, fetchInvite } from '@/features/public/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { membershipsKey, useShopContext } from './ShopProvider';

export function InvitePage() {
  const { token = '' } = useParams();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { selectShop } = useShopContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invite = useQuery({ queryKey: ['invite', token], queryFn: () => fetchInvite(token) });
  const next = encodeURIComponent(`/invite/${token}`);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const shopId = await acceptInvite(token);
      selectShop(shopId);
      await queryClient.invalidateQueries({ queryKey: membershipsKey(user?.id) });
      navigate('/', { replace: true });
    } catch (err) {
      setError(describeError(err, t));
      setBusy(false);
    }
  };

  const body = () => {
    if (invite.isPending) return <PageSpinner label={t.common.loading} />;
    const data = invite.data;
    if (!data) return <p className="text-ink-2">{t.invite.notFound}</p>;
    if (data.accepted) return <p className="text-ink-2">{t.invite.used}</p>;
    if (data.expired) return <p className="text-ink-2">{t.invite.expired}</p>;
    const wrongUser = user && user.email?.toLowerCase() !== data.email;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-medium">{t.invite.joinShop(data.shop_name)}</p>
        <p className="text-ink-2">{t.invite.as(t.roles[data.role])}</p>
        {!user ? (
          <>
            <p className="text-ink-2">{t.invite.signInFirst(data.email)}</p>
            <ButtonLink to={`/signup?next=${next}`} variant="primary" size="lg">
              {t.auth.signUp}
            </ButtonLink>
            <ButtonLink to={`/login?next=${next}`} size="lg">
              {t.auth.signIn}
            </ButtonLink>
          </>
        ) : wrongUser ? (
          <>
            <p className="text-ink-2">{t.invite.wrongAccount(data.email)}</p>
            <Button variant="secondary" onClick={() => signOut()}>
              {t.app.nav.signOut}
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={accept} loading={busy}>
            {t.invite.accept}
          </Button>
        )}
        {error && <p role="alert" className="text-sm text-danger-ink">{error}</p>}
      </div>
    );
  };

  return (
    <PublicFrame title={t.invite.title}>
      <h1 className="mb-6 mt-6 text-2xl font-semibold tracking-tight sm:mt-12">{t.invite.title}</h1>
      {body()}
      {!user && (
        <p className="mt-8 text-sm">
          <Link to="/" className="text-accent hover:underline">
            {t.notFound.home}
          </Link>
        </p>
      )}
    </PublicFrame>
  );
}
