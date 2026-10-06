# OhMann Frontend

React (Vite) client for OhMann, a launch trajectory optimization and interplanetary transfer planning app (ESE3104 Full Stack Java-1). The REST API lives in the separate **ohmann-backend** repository.

**Stack:** React 18, Vite 5, Axios, React Router, Recharts, Three.js

## Run locally

```bash
npm install
cp .env.example .env      # points at http://localhost:8080/api
npm run dev               # http://localhost:5173
```

## Deploy on Render (Static Site)

1. Render > New > **Static Site** > connect this repository.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Environment: `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
5. After creation, open **Redirects/Rewrites** and add: Source `/*`, Destination `/index.html`, Action **Rewrite**. This keeps React Router routes working on page refresh.
6. Make sure the backend's `CORS_ALLOWED_ORIGINS` includes this site's URL (the default `https://*.onrender.com` already does).

`VITE_API_URL` is read at build time, so trigger a manual deploy after changing it. A `render.yaml` Blueprint with the same settings is included.

Note: the backend Web Service on the Render free tier sleeps after about 15 minutes idle, so the first request after a pause can take 30 to 60 seconds.
