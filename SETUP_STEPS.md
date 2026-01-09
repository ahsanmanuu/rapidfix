# Supabase Setup - Step by Step

## ✅ Status: Environment Configured

Your `.env` file has been created with your Supabase credentials.

---

## 📋 Next Steps

### Step 1: Run SQL Schema in Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/cmyazetngnfesfmeohuj/sql/new

2. **Copy the SQL schema:**
   - Open in your editor: `server/supabase-schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and Run:**
   - Paste into Supabase SQL Editor
   - Click **"Run"** button (bottom right)
   - Wait for "Success" message

**Expected output:**
```
Fixofy schema created successfully!
Next steps:
1. Create Storage buckets in Supabase Dashboard
2. Get your Supabase URL and service_role key
3. Run the migration script to import JSON data
```

---

### Step 2: Create Storage Buckets

1. **Go to Storage:**
   - https://app.supabase.com/project/cmyazetngnfesfmeohuj/storage/buckets

2. **Create 3 new buckets:**

   **Bucket 1: technician-documents**
   - Click "New bucket"
   - Name: `technician-documents`
   - Public bucket: ✅ **YES** (toggle ON)
   - Click "Create bucket"

   **Bucket 2: user-avatars**
   - Click "New bucket"
   - Name: `user-avatars`
   - Public bucket: ✅ **YES** (toggle ON)
   - Click "Create bucket"

   **Bucket 3: job-attachments**
   - Click "New bucket"
   - Name: `job-attachments`
   - Public bucket: ❌ **NO** (toggle OFF)
   - Click "Create bucket"

---

### Step 3: Run Data Migration

Once Steps 1 & 2 are complete, I'll run the migration script automatically.

---

## ⏳ Waiting for Your Confirmation

Please complete Steps 1 & 2 above, then reply:
- **"schema done"** - if SQL ran successfully
- **"buckets done"** - if storage buckets created
- **"all done"** - if both steps completed

I'll then run the migration script for you! 🚀
