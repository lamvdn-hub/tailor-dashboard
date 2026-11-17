import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button, IconButton } from '@/ui/Button';
import { useFeedback } from '@/ui/Feedback';
import { Spinner } from '@/ui/Spinner';
import { describeError } from '@/lib/errors';
import { ACCEPTED_IMAGE_TYPES, MAX_SOURCE_BYTES } from '@/lib/image';
import { MAX_PHOTOS_PER_ORDER } from '@/lib/config';
import { deletePhoto, orderPhotosQuery, uploadPhoto, type PhotoWithUrls } from './photosApi';

export function PhotoGallery({ shopId, orderId }: { shopId: string; orderId: string }) {
  const { t } = useI18n();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const photos = useQuery(orderPhotosQuery(shopId, orderId));
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const list = photos.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: orderPhotosQuery(shopId, orderId).queryKey });

  const upload = async (files: File[]) => {
    const room = MAX_PHOTOS_PER_ORDER - list.length;
    if (files.length > room) toast(t.orders.tooManyPhotos(MAX_PHOTOS_PER_ORDER), 'error');
    const batch = files.slice(0, Math.max(room, 0));
    if (!batch.length) return;
    setProgress({ done: 0, total: batch.length });
    for (const [i, file] of batch.entries()) {
      try {
        if (file.size > MAX_SOURCE_BYTES) throw new Error('too_large');
        await uploadPhoto(shopId, orderId, file);
      } catch (err) {
        const decodeFailed = err instanceof Error && /decode|source|encode|load/i.test(err.message);
        toast(decodeFailed ? t.orders.unsupportedImage(file.name) : `${t.orders.uploadFailed(file.name)}: ${describeError(err, t)}`, 'error');
      }
      setProgress({ done: i + 1, total: batch.length });
    }
    setProgress(null);
    refresh();
  };

  const remove = async (photo: PhotoWithUrls) => {
    if (!(await confirm({ title: t.orders.deletePhotoConfirm, danger: true, confirmLabel: t.common.delete }))) return;
    try {
      await deletePhoto(photo);
      setViewing(null);
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const onFiles = (input: HTMLInputElement) => {
    void upload(Array.from(input.files ?? []));
    input.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <input ref={pick} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="sr-only" tabIndex={-1} onChange={(e) => onFiles(e.target)} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => onFiles(e.target)} />

      {photos.isPending ? (
        <div className="flex justify-center py-6 text-ink-3">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <p className="py-2 text-sm text-ink-3">{t.orders.noPhotos}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {list.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setViewing(i)}
                className="block aspect-square w-full overflow-hidden rounded-xl bg-sunken"
                aria-label={t.orders.photoOf(i + 1, list.length)}
              >
                <img src={p.thumbUrl} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {progress ? (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-2">
          <Spinner className="size-4" /> {t.orders.uploading(progress.done, progress.total)}
        </p>
      ) : (
        list.length < MAX_PHOTOS_PER_ORDER && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="secondary" icon={<Camera className="size-4" />} onClick={() => camera.current?.click()} className="sm:hidden">
              {t.orders.takePhoto}
            </Button>
            <Button variant="secondary" icon={<ImagePlus className="size-4" />} onClick={() => pick.current?.click()}>
              {t.orders.addPhotos}
            </Button>
          </div>
        )
      )}
      <p className="text-xs text-ink-3">{t.orders.photoHint}</p>

      {viewing !== null && list[viewing] && (
        <Lightbox
          photos={list}
          index={viewing}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  onDelete,
}: {
  photos: PhotoWithUrls[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (p: PhotoWithUrls) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const photo = photos[index]!;
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    ref.current?.showModal();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white"
      aria-label={t.orders.photoOf(index + 1, photos.length)}
    >
      <div
        className="relative flex h-full flex-col"
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start !== null && end !== undefined && Math.abs(end - start) > 50) go(end < start ? 1 : -1);
          touchX.current = null;
        }}
      >
        <div className="flex items-center justify-between p-2 pt-safe">
          <span className="tabular px-3 text-sm text-white/70">
            {index + 1} / {photos.length}
          </span>
          <div className="flex">
            <IconButton label={t.common.delete} onClick={() => onDelete(photo)} className="text-white hover:bg-white/10">
              <Trash2 className="size-5" />
            </IconButton>
            <IconButton label={t.common.close} onClick={onClose} className="text-white hover:bg-white/10">
              <X className="size-6" />
            </IconButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-safe">
          <img src={photo.url} alt={t.orders.photoOf(index + 1, photos.length)} className="max-h-full max-w-full object-contain" />
        </div>
        {photos.length > 1 && (
          <>
            <IconButton label={t.common.previous} onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 sm:inline-flex">
              <ChevronLeft className="size-6" />
            </IconButton>
            <IconButton label={t.common.next} onClick={() => go(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 sm:inline-flex">
              <ChevronRight className="size-6" />
            </IconButton>
          </>
        )}
      </div>
    </dialog>
  );
}
