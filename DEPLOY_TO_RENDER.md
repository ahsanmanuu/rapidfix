# Deploy Supabase Configuration to Render

## 🎯 Goal
Update your Render deployment to use Supabase instead of JSON files.

---

## Step 1: Update Render Environment Variables

1. **Go to Render Dashboard:**
   - https://dashboard.render.com
   - Select your Fixofy service

2. **Click "Environment" tab (left sidebar)**

3. **Add these 3 variables:**

   **Variable 1:**
   - Key: `SUPABASE_URL`
   - Value: `https://cmyazetngnfesfmeohuj.supabase.co`
   - Click "Add"

   **Variable 2:**
   - Key: `SUPABASE_SERVICE_KEY`
   - Value: `sb_secret_cVXGMAHUQAo2b95j9QsgYw_iL5mH343`
   - Click "Add"

   **Variable 3:**
   - Key: `USE_SUPABASE`
   - Value: `true`
   - Click "Add"

4. **Click "Save Changes"**

---

## Step 2: Commit and Push Code

Your local code has all the Supabase changes. Push to trigger Render deployment:

```bash
cd c:\Users\ahsan\OneDrive\Desktop\fixofy

git add .
git commit -m "Enable Supabase database and storage"
git push origin main
```

---

## Step 3: Wait for Deployment

1. Render will automatically start deploying
2. Watch the "Logs" tab
3. Wait for "Your service is live" message (~2-3 minutes)

---

## Step 4: Verify

**Test on live site:**
1. Try logging in with old credentials → Should still work (JSON data)
2. Register a new user → Should go to Supabase
3. Check Supabase Dashboard → See new user!

---

## ⚠️ Important Notes

### Old Data Behavior
- **Old users (4)**: Remain in JSON on Render server
- **Old technicians (3)**: Remain in JSON
- **They can still login!** (JSON files not deleted)

### New Data Behavior
- **New registrations**: Go to Supabase
- **New uploads**: Go to Supabase Storage
- **Scalable**: No more JSON file limits

### If Problems Occur
**Rollback instantly:**
1. Go to Render → Environment
2. Change `USE_SUPABASE` to `false`
3. Click "Save Changes"
4. Redeploy

---

## 🎯 Expected Result

After deployment:
- ✅ Old users can login (from JSON)
- ✅ New users go to Supabase
- ✅ File uploads go to Supabase Storage
- ✅ Scalable production setup

---

## 💡 Pro Tip

Keep JSON files on Render server for 30 days as backup. They won't be written to anymore but can be read if needed.
