import { Inbox, Layers, LogOut, ShieldCheck, Store, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { overviewQuery } from '@/features/overview/api';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { List, Row } from '@/ui/List';
import { Badge } from '@/ui/Badge';
import { LanguageSwitch } from './PublicFrame';

/** Mobile-only hub for secondary destinations. */
export function MorePage() {
  const { t } = useI18n();
  const { shop } = useShop();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const overview = useQuery(overviewQuery(shop.id));
  const open = overview.data?.open_inquiries ?? 0;
  const icon = (I: typeof Inbox) => <I className="size-5 text-ink-3" aria-hidden />;

  return (
    <Page title={t.app.nav.more} subtitle={shop.name} actions={<LanguageSwitch />}>
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <List>
            <Row to="/fabrics" leading={icon(Layers)} title={t.app.nav.fabrics} />
            <Row to="/inbox" leading={icon(Inbox)} title={t.app.nav.inbox} trailing={open > 0 ? <Badge tone="danger">{open}</Badge> : undefined} />
          </List>
        </Card>
        <Card className="overflow-hidden">
          <List>
            <Row to="/settings" leading={icon(Store)} title={t.app.nav.settings} />
            <Row to="/account" leading={icon(UserRound)} title={t.app.nav.account} />
            <Row to="/privacy" leading={icon(ShieldCheck)} title={t.app.nav.privacy} />
          </List>
        </Card>
        <Card className="overflow-hidden">
          <List>
            <Row
              onClick={() => signOut().then(() => navigate('/login', { replace: true }))}
              leading={icon(LogOut)}
              title={t.app.nav.signOut}
              chevron={false}
            />
          </List>
        </Card>
      </div>
    </Page>
  );
}
