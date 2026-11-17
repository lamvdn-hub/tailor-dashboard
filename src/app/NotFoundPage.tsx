import { useI18n } from '@/i18n';
import { PublicFrame } from './PublicFrame';
import { ButtonLink } from '@/ui/Button';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <PublicFrame title={t.notFound.title}>
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
        <p className="text-ink-2">{t.notFound.body}</p>
        <ButtonLink to="/" variant="primary">
          {t.notFound.home}
        </ButtonLink>
      </div>
    </PublicFrame>
  );
}
