# Fixofy Supabase Migration Guide

## 📋 Prerequisites

1. **Supabase Account**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database initialization (~2 minutes)

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy `Project URL`
   - Copy `service_role` key (NOT the anon key)

---

## 🚀 Migration Steps

### Step 1: Set Up Supabase Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `server/supabase-schema.sql`
3. Paste into SQL Editor and click "Run"
4. Wait for success message

### Step 2: Create Storage Buckets

1. Go to Storage → Create bucket
2. Create three public buckets:
   - `technician-documents`
   - `user-avatars`
   - `job-attachments`
3. For each bucket, set to **Public** bucket

### Step 3: Configure Environment Variables

1. Create `.env` file in `server/` directory:
```bash
cd server
copy .env.example .env
```

2. Edit `.env` and fill in your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
USE_SUPABASE=false  # Keep as false during migration
PORT=3000
```

### Step 4: Run Data Migration

```bash
cd server
node migrate-to-supabase.js
```

Expected output:
```
🚀 Starting Fixofy → Supabase Migration
✅ Supabase connection successful

📦 Migrating users.json -> users...
   ✅ Migrated 15 records
   
📦 Migrating technicians.json -> technicians...
   ✅ Migrated 8 records
   
... (continues for all tables)

📁 Migrating files from /uploads...
   ✅ Uploaded tech_photo_1.jpg to technician-documents
   
🔗 Updating file URLs to Supabase Storage...
   ✅ Updated URLs for technician 1234567890

✨ Migration complete!
```

### Step 5: Verify Data

1. Open Supabase Dashboard → Table Editor
2. Check each table has data:
   - users
   - technicians
   - jobs
   - feedbacks
   - etc.

3. Go to Storage and verify files are uploaded

### Step 6: Switch to Supabase

1. Edit `server/.env`:
```env
USE_SUPABASE=true  # Change from false to true
```

2. Restart server:
```bash
npm start
```

3. Test key functionality:
   - User login
   - Technician registration
   - Job creation
   - File uploads

### Step 7: Update Frontend (if needed)

The frontend should continue working without changes since the API remains the same. However, verify:

1. Image URLs now point to Supabase CDN
2. All CRUD operations work
3. Real-time features still function

---

## 🔧 Troubleshooting

### Migration Script Fails

**Error: Cannot connect to Supabase**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Ensure schema was created successfully
- Verify Supabase project is active

**Error: Duplicate key violations**
- Migration was run multiple times
- Clear Supabase tables and re-run
- Or manually delete duplicate records

### Server Won't Start

**Error: Missing Supabase credentials**
- Ensure `.env` file exists in `server/` directory
- Check credentials are correct
- Verify `.env` is not in `.gitignore` locally

**Error: Module not found @supabase/supabase-js**
- Run `npm install` in `server/` directory

### Images Not Loading

- Check Storage bucket is set to **Public**
- Verify file paths in database match uploaded files
- Check browser console for CORS errors

---

## 🔄 Rollback Plan

If something goes wrong, you can rollback:

1. Set `USE_SUPABASE=false` in `.env`
2. Restart server
3. Your JSON files are still intact in `/data`

**Keep JSON backups for 30 days** before deleting.

---

## ✅ Post-Migration Checklist

- [ ] All tables have correct record counts
- [ ] Files are accessible via Supabase Storage URLs
- [ ] User login works
- [ ] Technician dashboard works
- [ ] Job creation/updates work
- [ ] Admin dashboard works
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Performance is acceptable

---

## 📊 What Changed?

### Backend
- ✅ Database switched from JSON files to PostgreSQL
- ✅ File storage moved to Supabase Storage
- ✅ All managers now use async/await
- ✅ IDs changed from timestamp strings to UUIDs
- ✅ Field names standardized (camelCase → snake_case)

### What Stayed the Same
- ✅ All manager methods have same signatures
- ✅ All API endpoints unchanged
- ✅ Business logic preserved
- ✅ Frontend code unchanged
- ✅ Real-time features still work

---

## 🎯 Next Steps

### Recommended Optimizations

1. **Enable Row Level Security (RLS)**
   - Currently bypassed via service_role
   - Implement policies for user/technician access

2. **Set up Realtime Subscriptions**
   - Replace Socket.io with Supabase Realtime
   - Reduce server load

3. **

Add Database Functions**
   - Move complex queries to PostgreSQL functions
   - Improve performance

4. **Implement Backups**
   - Enable Supabase daily backups
   - Export data weekly

---

## 💡 Tips

- Monitor Supabase Dashboard for real-time metrics
- Use Supabase Logs for debugging
- Free tier limits: 500MB DB + 1GB Storage
- Upgrade if you exceed limits

---

## 🆘 Need Help?

- Supabase Docs: https://supabase.com/docs
- GitHub Issues: [Your repo]
- Email: [Your email]

**Migration created**: $(date)
**Estimated time**: 30 minutes
