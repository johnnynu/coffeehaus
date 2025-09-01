/**
 * Transforms Google Images URLs to request different sizes
 * Google Images URLs have format: ...=w{width}-h{height}-k-no
 */

export const getOptimizedImageUrl = (
  originalUrl: string, 
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
) => {
  // If it's not a Google Images URL, return as-is
  if (!originalUrl.includes('googleusercontent.com') && !originalUrl.includes('=w')) {
    return originalUrl;
  }

  const sizeParams = {
    thumbnail: 'w300-h200-k-no',  // For search result cards
    medium: 'w600-h400-k-no',     // For general use
    large: 'w1200-h800-k-no'      // For detail pages
  };

  // Replace existing size parameters with new ones
  return originalUrl.replace(/=w\d+-h\d+-k-no/g, `=${sizeParams[size]}`);
};

export const getThumbnailUrl = (originalUrl: string) => {
  return getOptimizedImageUrl(originalUrl, 'thumbnail');
};

export const getLargeImageUrl = (originalUrl: string) => {
  return getOptimizedImageUrl(originalUrl, 'large');
};

export const getMediumImageUrl = (originalUrl: string) => {
  return getOptimizedImageUrl(originalUrl, 'medium');
};