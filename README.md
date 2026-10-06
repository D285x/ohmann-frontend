# OhMann Frontend

React (Vite) client for OhMann, a launch trajectory optimization and interplanetary transfer planning app (ESE3104 Full Stack Java-1). The REST API lives in the separate **ohmann-backend** repository.

**Stack:** React 18, Vite 5, Axios, React Router, Recharts, Three.js

## Run locally

```bash
npm install
cp .env.example .env      # points at http://localhost:8080/api
npm run dev               # http://localhost:5173
```

## Deploy on Vercel

1. Vercel > Add New > Project > import this repository.
2. Framework preset: **Vite** (build `npm run build`, output `dist`, both detected automatically).
3. Environment Variables: `VITE_API_URL` = `https://<your-render-backend>.onrender.com/api`
4. Deploy. `vercel.json` rewrites every path to `index.html` so React Router routes survive a page refresh.
5. Add the Vercel URL to the backend's `CORS_ALLOWED_ORIGINS` on Render (the default already allows `https://*.vercel.app`).

`VITE_API_URL` is read at build time, so redeploy after changing it.

Note: the Render free tier sleeps after about 15 minutes idle, so the first request after a pause can take 30 to 60 seconds.
