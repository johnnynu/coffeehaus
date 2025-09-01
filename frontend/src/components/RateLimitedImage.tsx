import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface RateLimitedImageProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  loading?: 'lazy' | 'eager';
}

// Global queue to manage image loading across all components
const imageLoadQueue: Array<() => void> = [];
let isProcessingQueue = false;

const processQueue = () => {
  if (isProcessingQueue || imageLoadQueue.length === 0) return;
  
  isProcessingQueue = true;
  const nextLoad = imageLoadQueue.shift();
  
  if (nextLoad) {
    nextLoad();
    // Add delay between image loads to avoid rate limiting
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 400); // 400ms delay between images
  } else {
    isProcessingQueue = false;
  }
};

const RateLimitedImage = ({ 
  src, 
  alt, 
  className = '', 
  delay = 0,
  loading = 'lazy'
}: RateLimitedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = () => {
      setIsLoading(true);
      setHasError(false);
      
      // Create a new image to preload
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      
      img.src = src;
    };

    // Add to queue with optional delay
    const queueLoad = () => {
      imageLoadQueue.push(loadImage);
      processQueue();
    };

    if (delay > 0) {
      setTimeout(queueLoad, delay);
    } else {
      queueLoad();
    }

    // Cleanup: remove from queue if component unmounts
    return () => {
      const index = imageLoadQueue.indexOf(loadImage);
      if (index > -1) {
        imageLoadQueue.splice(index, 1);
      }
    };
  }, [src, delay]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-400 text-sm">Image unavailable</div>
        </div>
      </div>
    );
  }

  if (isLoading || !imageSrc) {
    return <Skeleton className={className} />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
};

export default RateLimitedImage;