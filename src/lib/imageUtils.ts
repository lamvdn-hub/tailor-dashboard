export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface ProcessedPhoto {
  id: string;
  file: Blob;
  thumbnail: Blob;
  preview: string;
  timestamp: string;
  originalName: string;
}

export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export async function generateThumbnail(file: File | Blob): Promise<Blob> {
  return compressImage(file, {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7
  });
}

export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${file.name} exceeds 5MB limit`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `${file.name} format not supported. Use JPG, PNG, or HEIC`
    };
  }

  return { valid: true };
}

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const compressed = await compressImage(file);
  const thumbnail = await generateThumbnail(file);
  const preview = URL.createObjectURL(compressed);

  return {
    id: crypto.randomUUID(),
    file: compressed,
    thumbnail: thumbnail,
    preview: preview,
    timestamp: new Date().toISOString(),
    originalName: file.name
  };
}

export function cleanupPhotoPreview(preview: string) {
  if (preview.startsWith('blob:')) {
    URL.revokeObjectURL(preview);
  }
}
