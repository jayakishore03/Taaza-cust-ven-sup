import { supabase } from '../lib/supabase';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImageToStorage(
  uri: string,
  bucket: string,
  folder?: string,
  fileName?: string
): Promise<string> {
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

    console.log('📤 Uploading image:', { uri, bucket, filePath });

    // Read file as base64 with proper encoding
    const base64 = await readAsStringAsync(uri, {
      encoding: 'base64', // Use string literal instead of enum
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(error.message || 'Failed to upload to storage');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('✅ File uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Upload delivery agent document to Supabase Storage
 */
export async function uploadAgentDocument(
  uri: string,
  agentId: string,
  documentType: 'selfie' | 'driving_license' | 'aadhar' | 'pan'
): Promise<string> {
  try {
    const bucket = 'delivery-agent-documents';
    const folder = agentId;
    const fileName = `${documentType}.jpg`;

    const publicUrl = await uploadImageToStorage(uri, bucket, folder, fileName);
    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading agent document:', error);
    throw new Error(error.message || 'Failed to upload document');
  }
}

