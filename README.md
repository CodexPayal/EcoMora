# EcoMora — AI-Powered Community Biodiversity Assistant

EcoMora is a full-stack web application designed to help communities discover, identify, record, and learn about local biodiversity.

The project supports **SDG 15 — Life on Land** by encouraging responsible biodiversity observation, community participation, and awareness of threats to ecosystems.

## 🌿 Features

* 🔍 **AI Species Identification** — Upload a species image and receive an AI-generated identification with confidence information.
* 🌱 **Biodiversity Information** — Enrich identified species with taxonomic information from GBIF and biodiversity information from iNaturalist.
* 📋 **Community Sightings** — Log, view, edit, and delete biodiversity observations.
* 🗺️ **Interactive Biodiversity Map** — Explore community sightings using Leaflet and OpenStreetMap.
* 🔎 **Sighting Filters** — Filter community observations by species and date range.
* 💬 **Ask EcoMora** — Ask biodiversity questions using the local AI assistant and built-in biodiversity knowledge.
* 📊 **Community Dashboard** — View total sightings, unique species, contributors, recent observations, and biodiversity trends.
* 🔐 **User Authentication** — Secure registration, login, JWT-based authentication, and protected actions.
* 🛡️ **Responsible AI & Privacy** — AI results include verification guidance, while exact sighting coordinates are hidden from public sighting cards.

---

## 🎯 Sustainable Development Goal

### SDG 15 — Life on Land

EcoMora contributes to SDG 15 by helping communities:

* Observe and document local biodiversity.
* Learn about wildlife, plants, and ecosystems.
* Understand common threats to biodiversity.
* Encourage responsible conservation awareness.
* Build community biodiversity records.

---

## 🧠 AI Approach

EcoMora uses a **free local AI approach** for the MVP.

### Species Identification

The application uses a locally running Hugging Face computer-vision model for image classification.

The model provides:

* Predicted species/common label
* Confidence score
* AI-generated identification description

Species identification is presented as a **prediction**, not a guaranteed scientific identification.

### Biodiversity Q&A

Ask EcoMora combines:

* Built-in biodiversity knowledge for common questions.
* A local **FLAN-T5** model as a fallback for other questions.
* Community sighting context without exposing exact coordinates.

This approach allows the MVP to run without requiring paid OpenAI API usage.

---

## 🌍 External Biodiversity Data

EcoMora integrates with:

### iNaturalist

Used to retrieve biodiversity information such as:

* Common species name
* Species image
* Taxon information
* iNaturalist reference

### GBIF

Used to retrieve taxonomic information such as:

* Kingdom
* Phylum
* Class
* Order
* Family
* Genus
* Scientific name
* Taxonomic status

---

## 🛡️ Responsible AI & Privacy

EcoMora is designed with responsible AI principles in mind.

### AI uncertainty

Species identification results are AI-generated predictions and may be incorrect. Important observations should be verified using reliable biodiversity sources before making conservation decisions.

### Location privacy

Users are encouraged to use approximate observation locations when possible, especially for rare or vulnerable species.

Exact coordinates are not displayed publicly on community sighting cards.

### Data minimization

Community-facing biodiversity records avoid exposing unnecessary sensitive location information.

---

## 🧰 Tech Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Frontend             | React + Vite + TypeScript               |
| Styling              | Tailwind CSS                            |
| Mapping              | Leaflet + OpenStreetMap + React-Leaflet |
| Charts               | Recharts                                |
| Backend              | FastAPI + Python 3.11                   |
| Database             | SQLite                                  |
| ORM                  | SQLAlchemy                              |
| Migrations           | Alembic                                 |
| Authentication       | JWT Bearer Tokens                       |
| AI / Computer Vision | Hugging Face Transformers + ResNet-50   |
| AI Q&A               | Hugging Face FLAN-T5                    |
| Biodiversity Data    | iNaturalist API + GBIF API              |
| HTTP Client          | HTTPX                                   |
| Containerization     | Docker + Docker Compose                 |

---

## 📁 Project Structure

```text
EcoMora/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── pages/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── alembic/
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   ├── static/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── ecomora-plan.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Python 3.11
* Node.js
* npm
* Git

Docker is optional for local development.

---

## ⚙️ Manual Setup

### 1. Clone the repository

```bash
git clone https://github.com/CodexPayal/EcoMora.git
cd EcoMora
```

### 2. Configure environment variables

Copy `.env.example` to `.env`.

For local development, use:

```env
DATABASE_URL=sqlite:///./ecomora.db
```

Generate a secure JWT secret with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Add the generated value to:

```env
JWT_SECRET=your-generated-secret
```

> Never commit `.env` or any API keys/secrets to GitHub.

---

## 🐍 Backend Setup

```bash
cd backend
```

Create a virtual environment:

### Windows

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload --env-file ..\.env
```

Backend:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## ⚛️ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The frontend communicates with the FastAPI backend through the configured API client.

---

## 🐳 Docker Setup

Docker Compose configuration is included for containerized deployment.

```bash
docker compose up --build
```

The Docker setup includes:

* React frontend served through Nginx
* FastAPI backend
* SQLite database
* Persistent application storage

Docker configuration is intended for environments where Docker is available.

---

## 🔌 API Overview

| Method   | Endpoint             | Description                         |
| -------- | -------------------- | ----------------------------------- |
| `GET`    | `/health`            | Backend health check                |
| `POST`   | `/auth/register`     | Register a user                     |
| `POST`   | `/auth/login`        | Login and receive JWT               |
| `GET`    | `/auth/me`           | Get authenticated user              |
| `POST`   | `/identify/identify` | Identify a species from an image    |
| `GET`    | `/sightings`         | List community sightings            |
| `POST`   | `/sightings`         | Create a sighting                   |
| `PATCH`  | `/sightings/{id}`    | Update a user's sighting            |
| `DELETE` | `/sightings/{id}`    | Delete a user's sighting            |
| `POST`   | `/chat`              | Ask EcoMora a biodiversity question |
| `GET`    | `/dashboard/stats`   | Retrieve dashboard statistics       |

Interactive API documentation is available through FastAPI Swagger UI at:

```text
http://127.0.0.1:8000/docs
```

---

## 🗺️ Biodiversity Mapping

EcoMora uses **Leaflet** with **OpenStreetMap** to display community biodiversity observations.

Users can:

* View logged sightings on the map.
* Filter sightings by species and date.
* Use **Pick Location** when adding a sighting.
* Clear active filters.
* Open a marker to view observation details.

Exact coordinates are not displayed in public sighting cards.

---

## 📊 Community Dashboard

The dashboard provides a community-level overview including:

* Total sightings
* Unique species
* Active contributors
* Recent sightings
* Sighting trends
* Top contributors

The dashboard is intended to provide a simple view of community biodiversity activity rather than a scientific population survey.

---

## 💬 Ask EcoMora

Ask EcoMora provides a conversational interface for biodiversity questions.

Example questions:

```text
What are the common threats to local biodiversity?

How does habitat loss affect wildlife?

Why is biodiversity important?

How can I help protect local biodiversity?
```

The assistant is designed to provide concise educational information and should not be treated as a substitute for expert ecological assessment.

---

## 🔐 Security

EcoMora uses:

* JWT authentication
* Protected API routes
* Password hashing
* Environment variables for secrets
* CORS configuration
* User-specific permissions for editing and deleting sightings

Sensitive configuration values should always remain in `.env`.

---

## 📌 Project Status

**EcoMora MVP — Completed**

Implemented:

* ✅ Full-stack React + FastAPI application
* ✅ User authentication
* ✅ AI species identification
* ✅ Local/free AI inference
* ✅ iNaturalist integration
* ✅ GBIF integration
* ✅ Community sighting management
* ✅ Interactive biodiversity map
* ✅ Sighting filters
* ✅ Community dashboard
* ✅ Ask EcoMora
* ✅ Responsible AI messaging
* ✅ Location privacy protection
* ✅ Docker configuration

---

## 🔮 Future Scope

Potential future improvements include:

* More specialized biodiversity identification models.
* Better text-based species identification.
* Offline/mobile support.
* More biodiversity datasets.
* Advanced ecological analytics.
* Community moderation tools.
* Species rarity and conservation-status indicators.
* Production cloud deployment.
* Improved image verification and confidence handling.

---

## 📄 License

MIT License
