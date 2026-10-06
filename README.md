# OhMann Frontend

React client for OhMann, a launch trajectory optimization and interplanetary transfer planning app (Full Stack Java-1 course project).

| | |
|---|---|
| **Live app** | https://ohmann-frontend.onrender.com |
| **Demo login** | `demo@ohmann.app` / `ohmann-demo` (or register your own account) |
| **Backend and full project documentation** | [D285x/ohmann-backend](https://github.com/D285x/ohmann-backend) |

> The backend runs on Render's free tier and sleeps when idle, so the first request after a pause takes 30 to 60 seconds. The demo database is reset on each restart; sample data and the demo login come back automatically.

**Stack:** React 18, Vite 5, Axios, React Router, Recharts, Three.js

## Layout

```
src/
├── api/client.js         Axios calls to the REST API (base URL from VITE_API_URL)
├── auth/AuthContext.jsx  Logged-in operator
├── components/           Navbar, footer, form field, charts, result panel, loaders
├── hooks/                Theme and scroll-reveal helpers
├── pages/                One file per screen
├── viz/                  Three.js scenes: home globe, flight replay, orbital simulation
└── styles.css            Design system (light and dark themes)
```

## Run locally

```bash
npm install
cp .env.example .env      # points at http://localhost:8080/api
npm run dev               # http://localhost:5173
```

Start the backend first (see the backend README), or set `VITE_API_URL` in `.env` to `https://ohmann-backend.onrender.com/api` to use the hosted one.

## Deploy on Render (Static Site)

1. Render > New > **Static Site** > connect this repository.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Environment: `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
5. After creation, open **Redirects/Rewrites** and add: Source `/*`, Destination `/index.html`, Action **Rewrite**. This keeps React Router routes working on page refresh.
6. Make sure the backend's `CORS_ALLOWED_ORIGINS` includes this site's URL (the default `https://*.onrender.com` already does).

`VITE_API_URL` is read at build time, so trigger a manual deploy after changing it. A `render.yaml` Blueprint with the same settings is included.
