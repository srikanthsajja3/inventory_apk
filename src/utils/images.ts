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

  // Supabase transformation URL format requires a Pro plan.
  // Returning the original URL ensures images load correctly.
  return url;
}

/**
 * Extracts the storage file path from a Supabase public URL.
 * @param url The public image URL
 * @param bucket The bucket name (e.g. 'item-images' or 'item-thumbnails')
 */
export function getStoragePathFromUrl(url: string, bucket: string): string | null {
  if (!url || !url.includes(`/${bucket}/`)) return null;
  const parts = url.split(`/${bucket}/`);
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Deletes a single file from a Supabase storage bucket by its public URL.
 * @param url The public image URL to delete
 * @param bucket The storage bucket name
 */
export async function deleteImageFromStorage(url: string, bucket: string): Promise<boolean> {
  const path = getStoragePathFromUrl(url, bucket);
  if (!path) return false;

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Failed to delete file from ${bucket}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete file from ${bucket}:`, err);
    return false;
  }
}

/**
 * Deletes multiple files from a Supabase storage bucket in a single request.
 * @param urls The public image URLs to delete
 * @param bucket The storage bucket name
 */
export async function deleteImagesInBulk(urls: string[], bucket: string): Promise<boolean> {
  const paths = urls
    .map(url => getStoragePathFromUrl(url, bucket))
    .filter((path): path is string => path !== null);

  if (paths.length === 0) return false;

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error(`Failed to delete bulk files from ${bucket}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete bulk files from ${bucket}:`, err);
    return false;
  }
}
