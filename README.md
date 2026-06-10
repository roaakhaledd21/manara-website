# Manara — Misinformation Verification Platform (Frontend)

Manara is a web app for journalists and fact-checkers to **verify news, detect
misinformation, and collaborate on investigations**. This repository contains the
**React frontend**, which talks to a Laravel (Sanctum) backend API.

Users can analyze text claims with AI for a credibility score, run reverse-image
search on uploaded images, search trusted news sources, draft and publish their
own articles, and warn the community about high-misinformation content through a
shared feed.

---

## Tech Stack

| Area | Choice |
|---|---|
| Framework | [React 19](https://react.dev) |
| Build tool | [Vite 8](https://vite.dev) |
| Routing | [React Router 7](https://reactrouter.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`) |
| Icons | [lucide-react](https://lucide.dev) |
| Backend client | `fetch` wrapper in `src/lib/api.js` (Bearer-token auth) |
| Auth backend | Laravel + Sanctum (token auth) |


---

## Features

- **Dashboard** — landing surface after login with key stats and shortcuts.
- **Verify News** (`/verify-news`)
  - **Text Analysis** → AI credibility score, verdict, keywords, sources, missing
    sources, and reasoning (`POST /verifications`).
  - **Image Analysis** → reverse-image search: circulation verdict, where the image
    appeared online, detected entities, visually similar images, and an AI summary
    (`POST /media-verify`).
  - **Search by Keywords & Source Trace** → searches trusted news sources
    (`GET /news-search`).
  - High-misinformation results can be **published to the community warning feed**.
- **News Composer** (`/news-composer`) — draft and publish news articles.
- **Community** (`/community`)
  - **Shared Investigations** — collaborative case "cards" you can create, join,
    edit, and delete (`/cards`).
  - **Community Feed** — live feed of verifications flagged as high-misinformation
    and published as public warnings (`GET /community`).
- **Trending News** (`/trending-news`) — trending headlines and topics.
- **Misinformation Archive** (`/archive`) — catalogue of debunked claims.
- **Auth** — two-step registration, login, protected routes, and logout.

---

## Project Structure

```
manara-website/
├── src/
│   ├── main.jsx                 # App entry
│   ├── App.jsx                  # Routes (React Router)
│   ├── index.css / App.css      # Global styles (Tailwind)
│   ├── components/
│   │   ├── Sidebar.jsx          # Main app navigation + user/logout
│   │   └── ProtectedRoute.jsx   # Guards routes; verifies session via GET /user
│   ├── lib/
│   │   ├── api.js               # API client, token storage, authApi helpers
│   │   └── supabase.js          # Optional Supabase client
│   ├── pages/
│   │   ├── Landing.jsx          # Public landing page  (/)
│   │   ├── Login.jsx            # /login
│   │   ├── Register.jsx         # /register  (step 1)
│   │   ├── RegisterStep2.jsx    # /register-step2
│   │   ├── Dashboard.jsx        # /dashboard  (protected)
│   │   ├── VerifyNews.jsx       # /verify-news
│   │   ├── NewsComposer.jsx     # /news-composer
│   │   ├── Community.jsx        # /community
│   │   ├── TrendingNews.jsx     # /trending-news
│   │   └── MisinformationArchive.jsx  # /archive
│   └── assets/                  # Images, logos, backgrounds, icons
├── index.html
├── vite.config.js
├── package.json
└── .env                         # Environment variables (not committed)
```

### Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register (step 1) | Public |
| `/register-step2` | Register (step 2) | Public |
| `/dashboard` | Dashboard | Protected |
| `/verify-news` | Verify News | Auth needed for API calls |
| `/news-composer` | News Composer | Auth needed for API calls |
| `/community` | Community | Auth needed for API calls |
| `/trending-news` | Trending News | — |
| `/archive` | Misinformation Archive | — |

---

## Prerequisites

- **Node.js 20.19+** (or 22.12+) and npm — required by Vite 8.
- The **Manara backend API** running and reachable (default `http://localhost:8000/api`).
  See `backend_api_documentation.md` and `frontend_integration.md` for the contract.

---

## Setup & Installation

```bash
# 1. Clone
git clone https://github.com/ALBaraa2/Manara.git
cd Manara   # then into the frontend folder if applicable (e.g. cd manara-website)

# 2. Install dependencies
npm install

# 3. Configure environment (see below)
#    create a .env file in the project root

# 4. Start the dev server
npm run dev
```

The dev server runs at **http://localhost:5173** by default.

### Environment Variables

Create a `.env` file in the project root:

```env
# Laravel backend base URL (include the /api suffix)
VITE_API_BASE_URL=http://localhost:8000/api

# Optional — Supabase (only if using Supabase-backed features)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> All client-exposed variables **must** be prefixed with `VITE_`.
> If `VITE_API_BASE_URL` is omitted, the app falls back to `http://localhost:8000/api`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over the project |

---

## How to Use

1. **Start the backend** so the API is reachable at your `VITE_API_BASE_URL`, then
   run `npm run dev` and open **http://localhost:5173**.
2. **Register** — go to `/register`, complete the two-step sign-up, or **Login** at
   `/login` if you already have an account. On success a token is stored in
   `localStorage` and attached to every protected request automatically.
3. **Verify content** — open **Verify News** from the sidebar:
   - Type or paste a claim and submit for an **AI credibility analysis**.
   - Click **Image Analysis** and upload an image (JPG/PNG/WebP/GIF) to run a
     **reverse-image search** — see where it has circulated online, similar images,
     and detected entities.
   - Click **Search by Keywords and Source Trace** to look up trusted sources.
   - If a result is high-misinformation, use **Publish to Community** to add it to
     the public warning feed.
4. **Collaborate** — open **Community**:
   - Browse the **Community Feed** of published misinformation warnings.
   - Create a **Shared Investigation**, then **Join**, **Edit**, or **Delete** cases
     you own.
5. **Compose** — use **News Composer** to draft and publish your own articles.
6. **Explore** — browse **Trending News** and the **Misinformation Archive**.
7. **Log out** from the bottom of the sidebar (clears the local session).

> **Auth note:** `ProtectedRoute` validates the session against `GET /user`. An
> expired/invalid token (`401`) is cleared automatically and you are redirected to
> `/login`.

---

## API Integration Status

The frontend is wired to the backend where endpoints exist; a few panels are
intentionally mocked where the backend has no matching endpoint yet.

| Feature | Endpoint | Status |
|---|---|---|
| Login / Register / Logout / Session | `/login`, `/register`, `/logout`, `/user` | ✅ Wired |
| Text credibility analysis | `POST /verifications` | ✅ Wired |
| Publish warning to community | `POST /verifications/{id}/publish` | ✅ Wired |
| Image reverse-image search | `POST /media-verify` | ✅ Wired |
| News source search | `GET /news-search` | ✅ Wired |
| Community warning feed | `GET /community` | ✅ Wired |
| Shared investigations (cards) | `/cards`, `/cards/{id}/members` | ✅ Wired |
| News Composer | composer endpoints | ✅ Wired |
| **Video Analysis** | — | ⚠️ Mocked (backend only processes images) |
| **Feed votes / comments** | — | ⚠️ Client-only (no backend support) |
| **Trending News / Archive / some stats** | — | ⚠️ Mocked (no endpoints yet) |

> Notes:
> - `GET /cards` returns only cards you **created or joined**, so the grid is empty
>   until you start or join an investigation.
> - The image-analysis `ai_summary` is returned in **Arabic** by the backend
>   regardless of input language.

---

## Repository

**GitHub:** https://github.com/ALBaraa2/Manara.git
