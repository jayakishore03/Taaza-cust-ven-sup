-- ============================================
-- SUPABASE STORAGE SETUP FOR DELIVERY AGENTS
-- ============================================
-- This script sets up the storage bucket and policies for delivery agent documents
-- Run this in Supabase SQL Editor after creating the delivery_agents table
-- ============================================

-- Step 1: Create Storage Bucket (if it doesn't exist)
-- Note: You can also create this via Supabase Dashboard > Storage > New Bucket
-- Bucket name: delivery-agent-documents
-- Public: Yes (so documents can be viewed in admin dashboard)

-- Create the bucket using Supabase Storage API or Dashboard
-- The bucket should be named: delivery-agent-documents
-- Make it PUBLIC so documents can be accessed

-- Step 2: Create Storage Policies for the bucket
-- These policies control who can upload, read, and delete documents

-- Policy 1: Allow authenticated users to upload their own documents
CREATE POLICY "Allow authenticated users to upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to read their own documents
CREATE POLICY "Allow authenticated users to read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow public read access (so admin dashboard can view documents)
CREATE POLICY "Allow public read access to delivery agent documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'delivery-agent-documents');

-- Policy 4: Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 5: Allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- MANUAL STEPS REQUIRED:
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: delivery-agent-documents
-- 4. Public: Yes (toggle ON)
-- 5. Click "Create bucket"
-- 6. Then run the policies above in SQL Editor
-- ============================================

SELECT '✅ Storage policies created. Remember to create the bucket manually in Dashboard!' as status;

