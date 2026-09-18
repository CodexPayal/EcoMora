# EcoMora — AI-Powered Community Biodiversity Assistant
## Project Plan

---

## Top-Level Overview

EcoMora is a full-stack web application that helps communities discover, log, and learn about local biodiversity. Users can identify species by uploading an image or writing a description (powered by OpenAI), log confirmed sightings tied to their account, explore sightings on an interactive Leaflet map, and ask open-ended biodiversity questions via an AI chat assistant. A dashboard surfaces community statistics (species count, recent activity, top contributors).

**Stack:**
- **Frontend:** React (Vite), Tailwind CSS, Leaflet/OpenStreetMap
- **Backend:** FastAPI (Python), SQLite, SQLAlchemy ORM
- **AI / External APIs:** OpenAI API, iNaturalist API, GBIF API
- **Auth:** JWT (access tokens stored in memory / httpOnly cookies)
- **Deployment:** Docker Compose (local) + live demo URL

**Non-goals:**
- No real-time/WebSocket features
- No admin panel (MVP scope)
- No payment or subscription logic

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding & Monorepo Layout

**Status:** `[x] done`

**Intent:**
Establish the full directory structure, tooling config, and shared conventions so every subsequent sub-task builds on a consistent foundation. This includes the Vite+React frontend scaffold, the FastAPI backend scaffold, Docker Compose, and environment variable wiring.

**Expected Outcomes:**
- `frontend/` bootstrapped with Vite + React + Tailwind CSS configured
- `backend/` bootstrapped with FastAPI, SQLAlchemy, Alembic for migrations, and a health-check endpoint at `GET /health`
- `docker-compose.yml` at the project root that starts both services
- `.env.example` documents all required secrets (`OPENAI_API_KEY`, `JWT_SECRET`, etc.)
- `README.md` at root with setup instructions

**Todo List:**
1. Create root `README.md` with project overview and local setup instructions
2. Scaffold `frontend/` using `npm create vite@latest` (React + TypeScript template)
3. Install and configure Tailwind CSS in the frontend
4. Create `frontend/src/` directory structure: `components/`, `pages/`, `hooks/`, `api/`, `context/`
5. Scaffold `backend/` Python project: `main.py`, `requirements.txt`, `alembic.ini`
6. Create `backend/` directory structure: `routers/`, `models/`, `schemas/`, `services/`, `core/`
7. Add FastAPI app entry point with a `GET /health` route returning `{"status": "ok"}`
8. Write `docker-compose.yml` with `frontend` and `backend` services
9. Write `.env.example` listing `OPENAI_API_KEY`, `JWT_SECRET`, `DATABASE_URL`
10. Add `.gitignore` for both Python and Node artifacts

**Relevant Context:**
- All feature sub-tasks depend on this scaffold being in place
- Tailwind green/earth palette should be set up in `tailwind.config.js` (custom color tokens)
- Backend should use `uvicorn` as the ASGI server in Docker

---

### Sub-Task 2 — Database Models & Migrations

**Status:** `[x] done`

**Intent:**
Define all SQLAlchemy ORM models and run the initial Alembic migration so the database schema is stable before any feature routes are built.

**Expected Outcomes:**
- `User`, `Sighting`, and `Species` SQLAlchemy models defined in `backend/models/`
- Initial Alembic migration generated and applied to `ecomora.db`
- Pydantic schemas (request/response) defined in `backend/schemas/` for each model

**Todo List:**
1. Define `User` model: `id`, `username`, `email`, `hashed_password`, `created_at`
2. Define `Species` model: `id`, `common_name`, `scientific_name`, `description`, `inaturalist_id`, `gbif_id`, `image_url`
3. Define `Sighting` model: `id`, `user_id` (FK), `species_id` (FK), `latitude`, `longitude`, `notes`, `photo_url`, `sighted_at`, `created_at`
4. Create Pydantic schemas for User (register, login, public response)
5. Create Pydantic schemas for Species (create, response)
6. Create Pydantic schemas for Sighting (create, response with nested user + species)
7. Configure SQLAlchemy engine + session in `backend/core/database.py`
8. Generate and apply the initial Alembic migration

**Relevant Context:**
- `Sighting` is the central entity — it links a `User`, a `Species`, a geographic coordinate, and an optional photo
- `Species` rows are created on first identification and reused for subsequent sightings of the same species
- Photo storage is file-system based (saved to `backend/static/uploads/`) — `photo_url` stores the relative path

---

### Sub-Task 3 — Authentication (Register / Login / JWT)

**Status:** `[x] done`

**Intent:**
Implement secure user registration and login with password hashing and JWT-based session management, so all subsequent features can enforce authenticated access.

**Expected Outcomes:**
- `POST /auth/register` accepts username/email/password, returns user info
- `POST /auth/login` accepts email/password, returns a signed JWT access token
- `GET /auth/me` returns the currently authenticated user (requires valid token)
- Frontend has a Register page, Login page, and auth context that stores the token and exposes the current user
- Protected routes redirect unauthenticated users to `/login`

**Todo List:**
1. Implement password hashing utility using `passlib[bcrypt]` in `backend/core/security.py`
2. Implement JWT creation and verification utilities in `backend/core/security.py`
3. Create `backend/routers/auth.py` with `register`, `login`, and `me` endpoints
4. Add a FastAPI dependency `get_current_user` that validates the Bearer token
5. Build `frontend/src/context/AuthContext.tsx` (stores token + user, exposes login/logout helpers)
6. Build `frontend/src/pages/RegisterPage.tsx` (form: username, email, password)
7. Build `frontend/src/pages/LoginPage.tsx` (form: email, password)
8. Implement protected route wrapper component `frontend/src/components/ProtectedRoute.tsx`
9. Wire up React Router with public routes (`/login`, `/register`) and protected routes (all others)

**Relevant Context:**
- Token should be stored in `localStorage` for simplicity (acceptable for an internship demo)
- All protected API calls must send `Authorization: Bearer <token>` headers — centralise this in an Axios instance in `frontend/src/api/client.ts`

---

### Sub-Task 4 — Species Identification Feature

**Status:** `[x] done`

**Intent:**
Build the core AI-powered identification flow where a user uploads a photo and/or provides a text description, the backend calls OpenAI (GPT-4o Vision for images, GPT-4o for text), and the result is enriched with data from iNaturalist/GBIF before being returned to the user.

**Expected Outcomes:**
- `POST /identify` endpoint accepts `multipart/form-data` with optional `image` file and optional `description` text
- Backend calls OpenAI with the image (base64) and/or description, returning structured species info (common name, scientific name, confidence, brief description)
- If iNaturalist or GBIF have a matching record, that data enriches the response (taxonomy, existing image URL)
- Frontend has an `IdentifyPage` with a file-drop zone + description textarea, submission button, and a results card
- The results card shows species name, confidence, description, and a "Log this Sighting" button

**Todo List:**
1. Create `backend/services/openai_service.py` — function `identify_species(image_bytes, description)` that calls GPT-4o with a structured prompt and returns parsed JSON
2. Create `backend/services/inaturalist_service.py` — function `search_inaturalist(scientific_name)` using the iNaturalist REST API
3. Create `backend/services/gbif_service.py` — function `search_gbif(scientific_name)` using the GBIF species match API
4. Create `backend/routers/identify.py` with `POST /identify`, wiring the three services with iNaturalist/GBIF as fallbacks
5. Build `frontend/src/pages/IdentifyPage.tsx` with image drop zone (react-dropzone) and description input
6. Build `frontend/src/components/IdentificationResult.tsx` to display the returned species card
7. Implement the "Log this Sighting" action — pre-fill the sighting form with identified species data

**Relevant Context:**
- GPT-4o accepts images as base64 data URLs in the `image_url` message part — use `"detail": "low"` to keep token costs down
- The OpenAI response should be prompted to return JSON with keys: `common_name`, `scientific_name`, `confidence`, `description`
- iNaturalist endpoint: `https://api.inaturalist.org/v1/taxa?q={name}`
- GBIF endpoint: `https://api.gbif.org/v1/species/match?name={name}`
- If both external lookups fail, the OpenAI result alone is sufficient

---

### Sub-Task 5 — Community Sighting Log (CRUD)

**Status:** `[x] done`

**Intent:**
Allow authenticated users to submit, view, edit, and delete sightings. Provide a community-wide feed of recent sightings for all users.

**Expected Outcomes:**
- `POST /sightings` creates a new sighting (requires auth); accepts species data, lat/lon, notes, optional photo upload
- `GET /sightings` returns paginated list of all sightings (public) with nested user and species info
- `GET /sightings/{id}` returns a single sighting detail
- `PATCH /sightings/{id}` / `DELETE /sightings/{id}` restricted to the sighting's owner
- Frontend has a `SightingsPage` (community feed) and a `LogSightingPage` (create form)
- Each sighting card shows species name, contributor, date, location label, and thumbnail

**Todo List:**
1. Create `backend/routers/sightings.py` with all five CRUD endpoints
2. Add file upload handling for photos — save to `backend/static/uploads/`, return relative URL
3. Enforce ownership check on PATCH/DELETE using `get_current_user` dependency
4. Build `frontend/src/pages/LogSightingPage.tsx` — form with species lookup (from identify flow or manual entry), lat/lon picker, notes, photo upload
5. Build `frontend/src/pages/SightingsPage.tsx` — paginated feed of `SightingCard` components
6. Build `frontend/src/components/SightingCard.tsx` — compact card with key sighting info
7. Add "Edit" and "Delete" controls on cards owned by the current user

**Relevant Context:**
- The lat/lon picker can be a simple two-number input for MVP; clicking on the map (Sub-Task 6) can also pre-fill it
- Photo upload uses `multipart/form-data` — use `FormData` on the frontend
- Pagination: use `?skip=0&limit=20` query params on `GET /sightings`

---

### Sub-Task 6 — Biodiversity Map

**Status:** `[x] done`

**Intent:**
Render all community sightings as interactive pins on a Leaflet/OpenStreetMap map so users can spatially explore biodiversity data.

**Expected Outcomes:**
- `MapPage` renders a full-viewport Leaflet map centered on the user's geolocation (or a default world view)
- Each sighting is a pin; clicking a pin opens a popup with species name, contributor, date, and a link to full sighting detail
- A filter sidebar allows filtering pins by species name or date range
- Clicking on the map during sighting creation captures lat/lon and passes it to `LogSightingPage`

**Todo List:**
1. Install `react-leaflet` and `leaflet` in the frontend; add Leaflet CSS import
2. Build `frontend/src/pages/MapPage.tsx` — map container fetching all sightings from `GET /sightings`
3. Build `frontend/src/components/SightingMarker.tsx` — custom marker with popup content
4. Add a filter panel component with species name text filter and date range inputs
5. Implement client-side filtering of markers based on active filters
6. Add a "📍 Pick Location" mode to the map that, when active, captures a click coordinate and routes to `LogSightingPage` with lat/lon pre-filled

**Relevant Context:**
- Use `react-leaflet` v4 with `MapContainer`, `TileLayer` (OSM), and `Marker`/`Popup` components
- Leaflet requires `import 'leaflet/dist/leaflet.css'` and a fix for default marker icon paths in Vite (override `L.Icon.Default.mergeOptions`)
- Avoid loading all sightings at once if the dataset grows — for MVP, a single `GET /sightings?limit=500` call is acceptable

---

### Sub-Task 7 — AI Biodiversity Q&A Chat

**Status:** `[x] done`

**Intent:**
Provide a conversational interface where users can ask any biodiversity-related question and receive answers from OpenAI, with context grounded in EcoMora's community data.

**Expected Outcomes:**
- `POST /chat` endpoint accepts a `message` string + optional conversation `history` array; returns an AI response
- The system prompt grounds the assistant as "EcoMora's biodiversity expert" and optionally injects recent sighting summaries as context
- Frontend has a `ChatPage` with a message thread UI and an input bar
- Chat history is held in component state (not persisted to DB for MVP)

**Todo List:**
1. Create `backend/routers/chat.py` with `POST /chat` — builds messages array with system prompt + history + new user message and calls `openai.chat.completions.create`
2. Design the system prompt: role as biodiversity expert, mention of local community data context
3. Optionally inject a short summary of recent sightings (last 10) into the system prompt for grounding
4. Build `frontend/src/pages/ChatPage.tsx` — scrollable message thread + sticky input bar
5. Build `frontend/src/components/ChatBubble.tsx` — user and assistant bubble variants
6. Handle loading state (typing indicator) while waiting for the API response

**Relevant Context:**
- Use `gpt-4o` model with `stream=False` for simplicity
- Conversation history should be passed as `[{"role": "user"|"assistant", "content": "..."}]` from the frontend
- Rate-limit awareness: for the demo, no hard limits are needed, but the frontend should disable the send button while a response is in flight

---

### Sub-Task 8 — Dashboard & Analytics

**Status:** `[x] done`

**Intent:**
Give users an at-a-glance view of community biodiversity activity through summary statistics and charts.

**Expected Outcomes:**
- `GET /dashboard/stats` returns: total sightings count, unique species count, top 5 contributors (username + count), sightings per day (last 30 days)
- Frontend `DashboardPage` shows: a hero stats bar, a line/bar chart of sightings over time, a leaderboard of top contributors, and a "recent sightings" mini-feed

**Todo List:**
1. Create `backend/routers/dashboard.py` with `GET /dashboard/stats` aggregation query
2. Build `frontend/src/pages/DashboardPage.tsx` — layout with stat cards + chart + leaderboard
3. Install and use `recharts` for the sightings-over-time chart
4. Build a `StatCard` component (icon, label, value)
5. Build a `TopContributors` leaderboard component
6. Make the page the default landing route after login

**Relevant Context:**
- SQLAlchemy aggregation: use `func.count`, `func.date`, and `group_by` for the time-series and contributor queries
- `recharts` `BarChart` or `LineChart` with `ResponsiveContainer` works well with Tailwind layouts

---

### Sub-Task 9 — Deployment (Docker Compose + Live Demo)

**Status:** `[x] done`

**Intent:**
Package both services into production-ready Docker images and provide a Docker Compose setup for local reproduction, plus instructions for deploying the live demo.

**Expected Outcomes:**
- `Dockerfile` in `frontend/` builds the Vite app and serves it via Nginx
- `Dockerfile` in `backend/` runs the FastAPI app via Uvicorn
- `docker-compose.yml` at root wires both containers with correct env vars and volume for SQLite + uploads
- `README.md` updated with Docker Compose quick-start and live demo URL section
- All secrets passed via `.env` file (not baked into images)

**Todo List:**
1. Write `frontend/Dockerfile` — multi-stage: Node build → Nginx serve
2. Write `frontend/nginx.conf` — serve `dist/`, proxy `/api` to backend, handle SPA fallback
3. Write `backend/Dockerfile` — Python slim image, install requirements, run uvicorn
4. Update `docker-compose.yml` — define `frontend`, `backend` services with env, volumes, port mappings
5. Add a named volume for `backend/static/uploads/` and `ecomora.db` persistence
6. Update `README.md` with `docker compose up` quick-start and environment variable table
7. Document deployment steps for a free-tier host (e.g. Render or Railway for backend, Vercel for frontend)

**Relevant Context:**
- The Nginx config must proxy `/api/*` → `http://backend:8000/*` so the frontend doesn't need a hardcoded backend URL
- SQLite file and uploads directory must be mounted as volumes so data persists across container restarts
- The backend `DATABASE_URL` should default to `sqlite:///./ecomora.db`

---

## Architecture Overview

```
ecomora/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/             # IdentifyPage, MapPage, ChatPage, DashboardPage, SightingsPage, LogSightingPage, LoginPage, RegisterPage
│   │   ├── components/        # IdentificationResult, SightingCard, SightingMarker, ChatBubble, StatCard, ...
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useAuth, useSightings, ...
│   │   └── api/               # client.ts (Axios instance), endpoints
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                   # FastAPI + SQLAlchemy + Alembic
│   ├── routers/               # auth, identify, sightings, chat, dashboard
│   ├── models/                # User, Species, Sighting
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # openai_service, inaturalist_service, gbif_service
│   ├── core/                  # database.py, security.py
│   ├── static/uploads/        # uploaded photos
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/
├── docker-compose.yml
├── .env.example
└── README.md
```
