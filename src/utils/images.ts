import { supabase } from '../../supabase';

/**
 * Generates an optimized image URL using Supabase's transformation service.
 * @param url The original image URL
 * @param options Transformation options (width, height, quality, format)
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'origin' } = {}
) {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return url;

  const { width = 400, quality = 80, format = 'webp' } = options;

  // Supabase transformation URL format:
  // https://[project-id].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=[w]&quality=[q]&format=[f]
  
  try {
    const baseUrl = url.split('/storage/v1/object/public/')[0];
    const path = url.split('/storage/v1/object/public/')[1];
    
    return `${baseUrl}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality}&format=${format}`;
  } catch (e) {
    return url;
  }
}

/**
 * Returns a fallback placeholder image URL.
 */
export function getPlaceholderUrl() {
  return 'https://via.placeholder.com/400?text=No+Image';
}
