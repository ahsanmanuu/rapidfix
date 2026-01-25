# 🚀 Render Deployment Instructions

Follow these exact settings to deploy your application on Render.

## 1. Create a New Web Service
- Connect your GitHub repository to Render.
- Select your repository.

## 2. Global Settings
| Setting | Value |
| :--- | :--- |
| **Name** | `fixofy` (or your preferred name) |
| **Runtime** | `Node` |
| **Region** | `Singapore` (or nearest to you) |
| **Branch** | `main` |
| **Root Directory** | `.` (Leave as default) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

## 3. Environment Variables
Go to the **Environment** tab and click **Add Environment Variable** for each of these:

| Key | Value |
| :--- | :--- |
| `USE_SUPABASE` | `true` |
| `SUPABASE_URL` | `https://cmyazetngnfesfmeohuj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `sb_secret_cVXGMAHUQAo2b95j9QsgYw_iL5mH343` |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU4` |
| `VITE_SUPABASE_URL` | `https://cmyazetngnfesfmeohuj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_EFIRYIJqIBNCk9lgql_S8g_riEKWii_` |
| `NODE_VERSION` | `18.x` (Recommended) |

## 4. Deploy
Click **Create Web Service**. Render will now install dependencies, build the frontend, and start the server.

---
**Note:** The build command executes `npm install` in both `client` and `server` folders and then builds the Vite frontend. The server then serves the built static files from `client/dist`.
