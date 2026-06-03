import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { ProcessedPhoto, processPhoto, validatePhotoFile, cleanupPhotoPreview } from '../lib/imageUtils';
import { useToast } from '../hooks/useToast';
import { Button } from './Button';

interface PhotoUploadProps {
  photos: ProcessedPhoto[];
  onChange: (photos: ProcessedPhoto[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onChange, maxPhotos = 5 }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      showToast(`Maximum ${maxPhotos} photos allowed`, 'error');
      return;
    }

    setIsProcessing(true);
    const newPhotos: ProcessedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validation = validatePhotoFile(file);
      if (!validation.valid) {
        showToast(validation.error || 'Invalid file', 'error');
        continue;
      }

      try {
        const processed = await processPhoto(file);
        newPhotos.push(processed);
      } catch (error) {
        console.error('Error processing photo:', error);
        showToast(`Failed to process ${file.name}`, 'error');
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
      showToast(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added`, 'success');
    }

    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      cleanupPhotoPreview(photo.preview);
    }
    onChange(photos.filter(p => p.id !== photoId));
  };

  const openLightbox = (index: number) => {
    window.open(photos[index].preview, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Garment Photos <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {photos.length} of {maxPhotos} photos
        </span>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${photos.length >= maxPhotos ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="photo-input"
          disabled={photos.length >= maxPhotos}
        />

        <div className="hidden md:block">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop photos here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">or</p>
        </div>

        <div className="md:hidden mb-4">
          <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        </div>

        <label htmlFor="photo-input">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || isProcessing}
            className="mx-auto"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Add Photos'}
          </Button>
        </label>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          Max {maxPhotos} photos, 5MB each. JPG, PNG, HEIC
        </p>
      </div>

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group aspect-square border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 transition"
              >
                <img
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openLightbox(index)}
                />

                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  {new Date(photo.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click photos to view full size
          </p>
        </>
      )}
    </div>
  );
}
