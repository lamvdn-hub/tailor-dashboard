// Client-side photo processing. Re-encoding through a canvas normalises
// orientation, caps the size and strips all EXIF metadata (including GPS).

export interface ProcessedImage {
  full: Blob;
  thumb: Blob;
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to <img>, which can decode HEIC on Safari.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function render(source: ImageBitmap | HTMLImageElement, maxSide: number, quality: number): Promise<Blob> {
  const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const h = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('canvas_unavailable'));
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/jpeg', quality),
  );
}

export async function processImage(file: Blob): Promise<ProcessedImage> {
  const source = await decode(file);
  try {
    const [full, thumb] = await Promise.all([render(source, 1600, 0.84), render(source, 400, 0.72)]);
    return { full, thumb };
  } finally {
    if ('close' in source) source.close();
  }
}

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
