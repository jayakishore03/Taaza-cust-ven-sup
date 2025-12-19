/**
 * Image Upload Service for Supabase Storage
 * Handles uploading shop photos, product images, and documents to Supabase Storage
 */

import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI from image picker
 * @param bucket - Supabase storage bucket name
 * @param folder - Optional folder path within bucket
 * @param fileName - Optional custom file name (will generate if not provided)
 */
export async function uploadImageToStorage(
  uri: string,
  bucket: string,
  folder?: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    console.log('[uploadImageToStorage] Starting upload...', { uri, bucket, folder });

    // Skip if URL is already a Supabase storage URL
    if (uri.startsWith('https://') && uri.includes('supabase')) {
      console.log('[uploadImageToStorage] Already a Supabase URL, skipping upload');
      return { success: true, url: uri };
    }

    // Generate file name if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const generatedFileName = fileName || `${timestamp}-${randomString}.${fileExtension}`;
    
    // Construct storage path
    const storagePath = folder 
      ? `${folder}/${generatedFileName}`
      : generatedFileName;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Determine content type
    const contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('[uploadImageToStorage] Upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('[uploadImageToStorage] Upload successful:', publicUrl);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('[uploadImageToStorage] Exception:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during upload',
    };
  }
}

/**
 * Upload multiple shop photos
 * @param uris - Array of local file URIs
 * @param shopId - Shop ID for organizing files
 */
export async function uploadShopPhotos(
  uris: string[],
  shopId: string
): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    
    // Skip empty URIs
    if (!uri || uri.trim() === '') {
      continue;
    }

    const result = await uploadImageToStorage(
      uri,
      'shop-images', // Supabase bucket name
      `shops/${shopId}`, // Folder within bucket
      `photo-${i + 1}` // File name
    );

    if (result.success && result.url) {
      urls.push(result.url);
    } else {
      errors.push(result.error || `Failed to upload photo ${i + 1}`);
    }
  }

  return {
    success: errors.length === 0,
    urls,
    errors,
  };
}

/**
 * Upload document image (PAN, GST, FSSAI, etc.)
 * @param uri - Local file URI
 * @param shopId - Shop ID
 * @param documentType - Type of document (pan, gst, fssai, etc.)
 */
export async function uploadDocument(
  uri: string,
  shopId: string,
  documentType: string
): Promise<UploadResult> {
  if (!uri || uri.trim() === '') {
    return { success: false, error: 'No document URI provided' };
  }

  // Skip if already a URL
  if (uri.startsWith('https://') && uri.includes('supabase')) {
    return { success: true, url: uri };
  }

  return uploadImageToStorage(
    uri,
    'shop-documents', // Supabase bucket name
    `shops/${shopId}`, // Folder
    documentType // File name prefix
  );
}

/**
 * Upload product image
 * @param uri - Local file URI
 * @param shopId - Shop ID
 * @param productName - Product name for file naming
 */
export async function uploadProductImage(
  uri: string,
  shopId: string,
  productName: string
): Promise<UploadResult> {
  if (!uri || uri.trim() === '') {
    return { success: false, error: 'No image URI provided' };
  }

  // Skip if already a URL
  if (uri.startsWith('https://') && uri.includes('supabase')) {
    return { success: true, url: uri };
  }

  // Sanitize product name for file name
  const sanitizedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  return uploadImageToStorage(
    uri,
    'product-images', // Supabase bucket name
    `shops/${shopId}`, // Folder
    sanitizedName // File name
  );
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image to delete
 * @param bucket - Supabase storage bucket name
 */
export async function deleteImageFromStorage(
  url: string,
  bucket: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from public URL
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('[deleteImageFromStorage] Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('[deleteImageFromStorage] Delete successful:', filePath);
    return { success: true };
  } catch (error: any) {
    console.error('[deleteImageFromStorage] Exception:', error);
    return { success: false, error: error.message };
  }
}

