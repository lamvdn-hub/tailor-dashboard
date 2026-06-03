import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Photo {
  id: string;
  file_url: string;
  thumbnail_url?: string;
  uploaded_at?: string;
}

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ photos, currentIndex, onClose, onNavigate }: LightboxProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition z-10"
        title="Close (Esc)"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition z-10"
          title="Previous (←)"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition z-10"
          title="Next (→)"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      <div
        className="max-w-5xl max-h-[90vh] mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.file_url}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />

        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            Photo {currentIndex + 1} of {photos.length}
          </p>
          {currentPhoto.uploaded_at && (
            <p className="text-gray-400 text-xs mt-1">
              {new Date(currentPhoto.uploaded_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <a
            href={currentPhoto.file_url}
            download
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
