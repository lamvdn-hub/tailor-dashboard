import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
    />
  );
}

export function PageSpinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-3">
      <Spinner className="size-6" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
