# EcoMora — AI-Powered Community Biodiversity Assistant

EcoMora is a full-stack web application that helps communities discover, log, and learn about local biodiversity. Users can:

- 🔍 **Identify species** by uploading a photo or writing a description (GPT-4o Vision)
- 📋 **Log sightings** with coordinates, notes, and photos, tied to their account
- 🗺️ **Explore the map** — all community sightings rendered as interactive pins on OpenStreetMap
- 💬 **Ask the AI assistant** open-ended biodiversity questions grounded in community data
- 📊 **View the dashboard** for community statistics, top contributors, and sighting trends

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Mapping | Leaflet / OpenStreetMap (react-leaflet v4) |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11) + SQLAlchemy ORM + Alembic |
| Database | SQLite (`ecomora.db`) — persisted via Docker named volume |
| AI | OpenAI API (GPT-4o / GPT-4o Vision) |
| External APIs | iNaturalist API, GBIF API |
| Auth | JWT Bearer tokens |
| Deployment | Docker Compose (local) · Render (backend) · Vercel (frontend) |

---

## Project Structure

```
ecomora/
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/         # IdentifyPage, MapPage, ChatPage, DashboardPage, …
│   │   ├── components/    # IdentificationResult, SightingCard, ChatBubble, …
│   │   ├── context/       # AuthContext
│   │   ├── hooks/         # useAuth, useSightings, …
│   │   └── api/           # client.ts (Axios instance)
│   ├── Dockerfile         # Node build → Nginx serve (multi-stage)
│   └── nginx.conf         # SPA fallback + /api proxy → backend
├── backend/               # FastAPI + SQLAlchemy + Alembic
│   ├── routers/           # auth, identify, sightings, chat, dashboard
│   ├── models/            # User, Species, Sighting
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # openai_service, inaturalist_service, gbif_service
│   ├── core/              # database.py, security.py
│   ├── static/uploads/    # uploaded photos (mounted as Docker volume)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile         # Python 3.11-slim + uvicorn
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick-Start — Docker Compose (recommended)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ecomora.git
cd ecomora

# 2. Create your .env file and fill in the secrets
cp .env.example .env
# Open .env and set: OPENAI_API_KEY, JWT_SECRET (at minimum)

# 3. Build and start all services
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Nginx) | http://localhost |
| Backend API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

> The SQLite database (`ecomora.db`) and uploaded photos are stored in named Docker volumes so they **persist across container restarts**. Run `docker compose down -v` only if you want to wipe all data.

---

## Manual Setup (without Docker)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables and fill in values
cp ../.env.example ../.env

# For local dev, override DATABASE_URL to use a local file
# In .env set: DATABASE_URL=sqlite:///./ecomora.db

# Run database migrations
alembic upgrade head

# Start the development server (auto-reload)
uvicorn main:app --reload --port 8000
```

### Frontend

> **Note:** `node_modules/` is gitignored — run `npm install` in `frontend/` after every fresh clone or dependency change.

```bash
cd frontend
npm install          # required after cloning
npm run dev          # starts at http://localhost:5173
```

The Vite dev server proxies `/api/*` → `http://localhost:8000` (configured in `vite.config.ts`). In production (Docker), Nginx handles the same proxy.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in the values below. **Never commit `.env` to version control.**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key for GPT-4o species identification and chat |
| `JWT_SECRET` | ✅ | — | Secret used to sign JWT access tokens. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | | `sqlite:////app/data/ecomora.db` | SQLAlchemy connection URL. Use the default for Docker; set to `sqlite:///./ecomora.db` for manual local dev |
| `JWT_ALGORITHM` | | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `60` | Token lifetime in minutes |
| `ALLOWED_ORIGINS` | | `http://localhost` | Comma-separated list of allowed CORS origins for the FastAPI middleware |

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check → `{"status": "ok"}` |
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Login, returns JWT access token |
| `GET` | `/auth/me` | ✅ | Get current authenticated user |
| `POST` | `/identify` | ✅ | Identify a species from image/description |
| `GET` | `/sightings` | — | List all sightings (paginated) |
| `POST` | `/sightings` | ✅ | Create a new sighting |
| `GET` | `/sightings/{id}` | — | Get a single sighting |
| `PATCH` | `/sightings/{id}` | ✅ | Update own sighting |
| `DELETE` | `/sightings/{id}` | ✅ | Delete own sighting |
| `POST` | `/chat` | ✅ | Ask the biodiversity AI assistant |
| `GET` | `/dashboard/stats` | — | Community statistics |

Full interactive docs: **http://localhost:8000/docs**

---

## Deployment

### Backend → Render (free tier)

1. Push the repository to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo; set **Root Directory** to `backend`.
4. **Runtime:** Docker (Render will detect the `Dockerfile` automatically).
5. Set the following **Environment Variables** in the Render dashboard:
   - `OPENAI_API_KEY` — your OpenAI key
   - `JWT_SECRET` — a strong random hex string
   - `DATABASE_URL` — `sqlite:////data/ecomora.db` (use Render's persistent disk, see below)
   - `JWT_ALGORITHM` — `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` — `60`
   - `ALLOWED_ORIGINS` — your Vercel frontend URL, e.g. `https://ecomora.vercel.app`
6. Under **Disks**, add a persistent disk mounted at `/data` (at least 1 GB) so the SQLite file and uploads survive deploys.
7. Click **Deploy**. The backend will be available at `https://<your-service>.onrender.com`.

> **Note:** Free-tier Render instances spin down after 15 minutes of inactivity. The first request after a cold start may take ~30 seconds.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the same GitHub repository; set **Root Directory** to `frontend`.
3. Vercel auto-detects Vite — no framework override needed.
4. Add one **Environment Variable:**
   - `VITE_API_URL` — the full Render backend URL, e.g. `https://<your-service>.onrender.com`
5. Click **Deploy**. The frontend is live at `https://<your-project>.vercel.app`.

> The Nginx `/api` proxy is only used in the Docker Compose setup. On Vercel, the frontend calls `VITE_API_URL` directly.  
> Add the Vercel URL to `ALLOWED_ORIGINS` on Render to allow CORS.

---

## License

MIT
