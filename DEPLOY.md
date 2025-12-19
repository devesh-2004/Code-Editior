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
    - Add keys from `.env.example` (e.g., `GEMINI_API_KEY`).
    - Set `CLIENT_URL` to your future Vercel URL (e.g., `https://your-app.vercel.app`).
6.  **Deploy**. Copy the provided URL (e.g., `https://api-123.onrender.com`).

## 2. Deploy Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com) > Add New > Project.
2.  Connect your repo.
3.  **Settings**:
    - **Root Directory**: `client`
    - **Framework Preset**: Next.js
4.  **Environment Variables**:
    - `NEXT_PUBLIC_BACKEND_API_URL`: Set this to your **Render Backend URL** (e.g., `https://api-123.onrender.com/api`).
    - Add `GITHUB_ID`, `GITHUB_SECRET`, etc.
5.  **Deploy**.

## 3. Final Connection
- Once Vercel is deployed, go back to Render and update `CLIENT_URL` to match your *actual* Vercel domain.
- Redeploy Backend.

## 4. Local Development
- Use `.env` (don't commit it!).
- `npm run dev` starts both locally.
