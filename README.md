# Doctor Tracker Frontend

Responsive Next.js App Router client for the Doctor Tracker assessment. It uses TypeScript, TanStack React Query, Recharts, and Lucide icons. The Express API is deployed separately.

## Run locally

```bash
cp .env.example .env.local
# Keep NEXT_PUBLIC_API_URL=http://localhost:5000/api for local backend development.
npm install
npm run dev
```

Open `http://localhost:3000`. The backend must be running and an administrator must have been seeded before login works.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for the Express API, including `/api` |

## Pages

- `/login` — administrator sign-in
- `/dashboard` — KPIs, seven-day registration chart, and patients-per-doctor chart
- `/doctors` — searchable, filterable, paginated doctor directory and create form
- `/doctors/:id` — doctor profile and associated patient list/create form
- `/patients` — global patient directory, filters, pagination, edit and delete

## Technical decisions

1. **React Query:** centralizes request caching, loading/error states, and invalidation after mutations so dashboard and directory counts stay current.
2. **Server-side filtering and pagination:** the frontend sends query parameters to Express and renders only the requested page rather than downloading all records.
3. **HTTP-only cookie:** all API requests include credentials; the JWT is not stored in local storage or exposed to browser JavaScript.

## Deployment (Vercel)

- Import this folder as its own GitHub repository/project.
- Set `NEXT_PUBLIC_API_URL` to `https://YOUR-API.onrender.com/api` before building.
- Configure the backend's `FRONTEND_ORIGIN` to the exact Vercel origin and test the login cookie in a fresh browser session.
- For separate HTTPS domains, the backend cookie commonly needs `SameSite=None; Secure`. Some browsers restrict third-party cookies; a same-site custom domain or same-origin proxy is more robust.

## QA checklist

- Sign in with a seeded admin, refresh each portal page, and verify protected routes redirect when signed out.
- Add a doctor, search/filter/date-filter doctors, and navigate to its profile.
- Add a patient to that doctor; confirm the global patient list and dashboard update.
- Edit and delete a patient; verify the table and analytics refresh.
- Test empty search results, API offline state, narrow/mobile widths, and date-range validation.

## Data safety

Use fictional records only. This is an assessment/demo UI, not a production clinical-record system.

## Screenshots for assessment

After starting the app and adding fictional demo records, capture at least:

- Desktop dashboard
- Desktop doctors directory
- Desktop patients directory
- Mobile dashboard or navigation

Save genuine screenshots in a `docs/screenshots/` directory and embed them here before final submission. Do not use real patient information or commit credentials in screenshots.
