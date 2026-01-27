# Deployment Instructions

This project requires a **Split Deployment** because it uses `Socket.IO` for real-time collaboration.

- **Frontend (Client)**: Deploy to **Vercel** (Excellent static/Next.js hosting).
- **Backend (Server)**: Deploy to **Render** or **Railway** (Required for persistent Socket.IO connections).

## 1. Deploy Backend (Render)
1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com) > New > Web Service.
3.  Connect your repo.
4.  **Settings**:
    - **Root Directory**: `server`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - `PORT`: `10000` (or leave default)
    - `CLIENT_URL`: Your future Vercel URL (e.g., `https://your-app.vercel.app`) - *Update this after deploying frontend*.
    - `GEMINI_API_KEY`: Your key.
6.  **Deploy**. Copy the provided URL (e.g., `https://api-123.onrender.com`).

## 2. Deploy Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com) > Add New > Project.
2.  Connect your repo.
3.  **Settings**:
    - **Root Directory**: `.` (Leave empty / Root)
    - **Build Command**: `npx next build ./client`
    - **Output Directory**: `client/.next`
    - **Framework Preset**: Next.js
4.  **Environment Variables** (CRITICAL):
    - `NEXT_PUBLIC_BACKEND_API_URL`: Your **Render Backend URL** (e.g., `https://api-123.onrender.com/api`).
    - `AUTH_GOOGLE_ID`: Your Google Client ID.
    - `AUTH_GOOGLE_SECRET`: Your Google Client Secret.
    - `NEXTAUTH_SECRET`: **Generate a secure random string**. Run `openssl rand -base64 32` in terminal to get one.
    - `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://your-app.vercel.app`).
5.  **Deploy**.

## 3. Final Connection
- Once Vercel is deployed, go back to Render Dashboard -> Environment Variables.
- Update `CLIENT_URL` to match your *actual* Vercel domain (no trailing slash).
- Redeploy Backend (Manual Deploy > Deploy latest commit).

## 4. Google Cloud Console
- Go to your Google Cloud Console for the OAuth credentials.
- Add your Vercel domain to **Authorized JavaScript origins**: `https://your-app.vercel.app`
- Add the callback path to **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/callback/google`
