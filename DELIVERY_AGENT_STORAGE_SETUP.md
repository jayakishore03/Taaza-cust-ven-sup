# Delivery Agent Storage Setup Guide

This guide explains how to set up Supabase Storage for delivery agent documents (selfie, driving license, Aadhar, PAN).

## 📋 Prerequisites

- Supabase project created
- `delivery_agents` table created (from `complete_sql_setup_with_delivery_agents.sql`)

## 🚀 Setup Steps

### Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"** button
4. Configure the bucket:
   - **Name**: `delivery-agent-documents`
   - **Public**: **Yes** (toggle ON) - This allows the admin dashboard to view documents
   - **File size limit**: 10 MB (or as needed)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `setup_delivery_agent_storage.sql`
3. Click **"Run"** to execute the policies

These policies will:
- Allow authenticated users to upload their own documents
- Allow authenticated users to read their own documents
- Allow public read access (so admin dashboard can view documents)
- Allow authenticated users to update/delete their own documents

### Step 3: Verify Setup

After creating the bucket and running the policies, you can verify:

1. **Check bucket exists**: Go to Storage > delivery-agent-documents
2. **Check policies**: Go to Storage > Policies > delivery-agent-documents
3. **Test upload**: Try registering a new delivery agent in the app

## 📁 File Structure

Documents will be stored in the following structure:
```
delivery-agent-documents/
  └── agents/
      └── {user_id}/
          ├── selfie-{timestamp}.jpg
          ├── driving_license-{timestamp}.jpg
          ├── aadhar-{timestamp}.jpg
          └── pan-{timestamp}.jpg
```

## 🔒 Security Notes

- Documents are organized by user ID for easy management
- Each user can only upload/access their own documents
- Public read access is enabled so admin dashboard can view documents
- Consider adding additional security policies if needed

## 🐛 Troubleshooting

### Images not displaying in admin dashboard

1. **Check bucket is public**: Storage > delivery-agent-documents > Settings > Public bucket should be ON
2. **Check policies**: Storage > Policies > Ensure public read policy exists
3. **Check URLs**: Verify the URLs in `delivery_agents` table are valid Supabase Storage URLs
4. **Check CORS**: If images still don't load, check browser console for CORS errors

### Upload fails

1. **Check authentication**: User must be authenticated to upload
2. **Check file size**: Ensure file is under the bucket's size limit
3. **Check file type**: Ensure file is an image (jpg, png, etc.)
4. **Check network**: Ensure device has internet connection
5. **Check console logs**: Look for error messages in the app console

### Permission errors

1. **Verify policies**: Run the SQL policies script again
2. **Check user ID**: Ensure the user_id matches the folder structure
3. **Check bucket name**: Ensure bucket name is exactly `delivery-agent-documents`

## 📝 Code Changes Made

1. **Created**: `taaza devlivery app/services/imageUpload.ts` - Image upload service
2. **Updated**: `taaza devlivery app/app/auth/register-documents.tsx` - Now uploads documents to Supabase Storage
3. **Created**: `setup_delivery_agent_storage.sql` - Storage policies SQL script

## ✅ Testing

After setup, test the flow:

1. Register a new delivery agent in the delivery app
2. Upload all documents (selfie, driving license, Aadhar, PAN)
3. Complete registration
4. Check Supabase Storage - documents should appear in `agents/{user_id}/`
5. Check admin dashboard - documents should be viewable

## 🔄 Updating Existing Agents

If you have existing agents with local URIs, you'll need to:
1. Re-upload their documents through the app, OR
2. Manually upload documents to Supabase Storage and update the URLs in the database

