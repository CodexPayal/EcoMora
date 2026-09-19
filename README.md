# 🌿 EcoMora — AI-Powered Community Biodiversity Assistant

EcoMora is a full-stack web application that helps communities discover, identify, record, and learn about local biodiversity.

The project was developed as part of the **1M1B AI for Sustainability Virtual Internship**, in collaboration with **AICTE and IBM SkillsBuild**, and aligns with **SDG 15 — Life on Land**.

**IBM BOB** was used during the ideation and development process to support the creation of this sustainability-focused solution.

---

## 🌱 Project Overview

EcoMora provides a community-focused platform for biodiversity observation, awareness, and learning.

Users can:

* 🔍 Identify species from uploaded images
* 📋 Log and manage biodiversity sightings
* 🗺️ Explore community sightings on an interactive map
* 🔎 Filter sightings by species and date
* 💬 Ask EcoMora biodiversity-related questions
* 📊 View community biodiversity statistics
* 🌍 Explore additional biodiversity information from iNaturalist and GBIF

The application also includes responsible AI and location-privacy guidance to encourage safe and responsible biodiversity reporting.

---

## 🎯 Sustainable Development Goal

### SDG 15 — Life on Land

EcoMora supports **SDG 15 — Life on Land** by encouraging:

* Biodiversity observation and documentation
* Community participation in biodiversity awareness
* Learning about local wildlife, plants, and ecosystems
* Awareness of biodiversity threats
* Responsible conservation practices

---

## 🏢 Internship Context

**Program:** 1M1B AI for Sustainability Virtual Internship

**Collaborating Organizations:** 1M1B, AICTE, and IBM SkillsBuild

**Project:** EcoMora — AI-Powered Community Biodiversity Assistant

**Primary SDG:** SDG 15 — Life on Land

**Ideation / Development Tool:** IBM BOB

The project was developed as part of the **1M1B AI for Sustainability Virtual Internship** in collaboration with **AICTE and IBM SkillsBuild**.

**IBM BOB** was used during the ideation and development process to support the planning and development of the sustainability-focused solution.

The final application was implemented using **React, FastAPI, local AI models, SQLite/PostgreSQL, and biodiversity data APIs**.

---

## ✨ Key Features

### 🔍 AI Species Identification

Users can upload an image to receive an AI-generated species prediction.

The identification workflow provides:

* Predicted species/common label
* Confidence score
* Identification description
* Biodiversity information from external sources when available

Species identification is presented as an AI prediction and should be independently verified for important observations.

### 🌿 Community Sightings

Authenticated users can:

* Add biodiversity sightings
* Record species information
* Add observation notes
* Upload photos
* Select observation locations
* Edit their own sightings
* Delete their own sightings

### 🗺️ Biodiversity Map

The interactive map allows users to:

* View community biodiversity observations
* Open sighting markers
* Use Pick Location while adding a sighting
* Filter observations by species
* Filter observations by date range
* Clear active filters

The public interface hides exact coordinates from community sighting cards to support location privacy.

### 💬 Ask EcoMora

Ask EcoMora provides a conversational biodiversity assistant.

Users can ask questions about:

* Wildlife
* Plants
* Fungi
* Ecosystems
* Biodiversity threats
* Habitat loss
* Pollution
* Climate change
* Conservation

The assistant combines built-in biodiversity knowledge with a local AI model for additional questions.

### 📊 Community Dashboard

The dashboard provides:

* Total sightings
* Unique species
* Active contributors
* Recent sightings
* Sighting trends
* Top contributors

The dashboard represents community activity and is not intended to replace a scientific biodiversity survey.

---

## 🤖 AI Implementation

EcoMora uses free, locally running AI models for the MVP.

### Species Identification

The application uses:

**Hugging Face Transformers + MobileNetV2**

The model performs image classification locally and returns a prediction with a confidence score.

### Biodiversity Q&A

Ask EcoMora uses:

**Hugging Face FLAN-T5**

The chat system also includes a built-in biodiversity knowledge layer for common biodiversity questions.

This local AI approach allows the MVP to operate without relying on paid OpenAI API usage.

---

## 🌍 Biodiversity Data Sources

EcoMora integrates external biodiversity services to enrich species information.

### iNaturalist API

Used for available species information such as:

* Common name
* Species image
* Taxon reference
* iNaturalist page

### GBIF API

Used for available taxonomic information such as:

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

EcoMora includes responsible AI and privacy considerations throughout the application.

### AI Verification

AI-generated species identifications may be incorrect. Users are encouraged to verify important observations using reliable biodiversity sources before making conservation-related decisions.

### Location Privacy

Users are encouraged to use approximate observation locations when possible, especially for rare or vulnerable species.

Exact coordinates are hidden from public community sighting cards.

### Data Minimization

The application avoids displaying unnecessary exact location information in public-facing biodiversity records.

---

## 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Mapping | Leaflet + OpenStreetMap + React-Leaflet |
| Charts | Recharts |
| Backend | FastAPI + Python 3.11 |
| Database | SQLite / PostgreSQL |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| Authentication | JWT Bearer Tokens |
| Image AI | Hugging Face Transformers + MobileNetV2 |
| Chat AI | Hugging Face FLAN-T5 |
| Biodiversity Data | iNaturalist API + GBIF API |
| HTTP Client | HTTPX |
| Containerization | Docker + Docker Compose |

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

Make sure the following are installed:

* Python 3.11
* Node.js
* npm
* Git

Docker is optional for local development.

### 1. Clone the Repository

```bash
git clone https://github.com/CodexPayal/EcoMora.git
cd EcoMora
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

For local development, use:

```env
DATABASE_URL=sqlite:///./ecomora.db
```

Generate a secure JWT secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then add the generated value to `.env`:

```env
JWT_SECRET=your-generated-secret
```

> **Important:** Never commit `.env`, passwords, API keys, or other secrets to GitHub.

### 3. Backend Setup

Open a terminal in the backend directory:

```bash
cd backend
```

Create a Python virtual environment.

#### Windows

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
```

#### macOS / Linux

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI development server:

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

### 4. Frontend Setup

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

---

## 🐳 Docker

Docker configuration is included through Docker Compose.

To run the containerized application:

```bash
docker compose up --build
```

The configuration includes:

* Frontend container
* FastAPI backend container
* Persistent application storage configuration

Docker is provided as part of the project's deployment configuration.

---

## 🔌 API Overview

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/health` | — | Backend health check |
| `POST` | `/auth/register` | — | Register a user |
| `POST` | `/auth/login` | — | Login and receive JWT |
| `GET` | `/auth/me` | ✅ | Get authenticated user |
| `POST` | `/identify/identify` | ✅ | Identify a species from an image |
| `GET` | `/sightings` | — | List community sightings |
| `POST` | `/sightings` | ✅ | Create a sighting |
| `PATCH` | `/sightings/{id}` | ✅ | Update own sighting |
| `DELETE` | `/sightings/{id}` | ✅ | Delete own sighting |
| `POST` | `/chat` | ✅ | Ask EcoMora a biodiversity question |
| `GET` | `/dashboard/stats` | — | Retrieve dashboard statistics |

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 🔐 Authentication & Security

EcoMora uses:

* JWT bearer authentication
* Protected API routes
* Password hashing
* User-specific permissions
* Environment variables for secrets
* CORS configuration
* Protected edit/delete operations

Sensitive configuration values should remain in `.env` and must not be committed to version control.

---

## 🗺️ Location Privacy

EcoMora uses geographic coordinates to support biodiversity mapping.

The application encourages users to provide approximate observation locations rather than exact sensitive locations when appropriate.

Public community sighting cards display:

```text
📍 Approximate location
Exact coordinates are hidden to protect location privacy.
```

Coordinates are still used internally to position biodiversity observations on the map.

---

## 📊 Project Status

### MVP Implementation

* ✅ React + Vite frontend
* ✅ FastAPI backend
* ✅ SQLite / PostgreSQL database
* ✅ User registration and login
* ✅ JWT authentication
* ✅ AI image-based species identification
* ✅ Local/free AI inference
* ✅ iNaturalist integration
* ✅ GBIF integration
* ✅ Community sighting management
* ✅ Interactive biodiversity map
* ✅ Species/date filters
* ✅ Pick Location
* ✅ Community dashboard
* ✅ Ask EcoMora
* ✅ Responsible AI messaging
* ✅ Location privacy protection
* ✅ Docker configuration
* ✅ GitHub repository
* ✅ Cloud deployment

---

## 🔮 Future Scope

Possible future improvements include:

* More specialized biodiversity identification models
* Improved text-based species identification
* Additional biodiversity datasets
* Species conservation-status information
* Advanced ecological analytics
* Community moderation
* Mobile application support
* Offline biodiversity observation support
* Improved image verification and confidence handling
* More advanced conversational biodiversity assistance

---

## 📚 Project Purpose

EcoMora demonstrates how AI, web technologies, community participation, and biodiversity data can be combined to create a sustainability-focused digital solution.

The project focuses on making biodiversity observation and learning more accessible while considering AI uncertainty, responsible reporting, and location privacy.

---

## 🤝 Internship & Sustainability Context

EcoMora was developed as part of the:

**1M1B AI for Sustainability Virtual Internship**

in collaboration with:

* **1M1B**
* **AICTE**
* **IBM SkillsBuild**

The project is aligned with:

**SDG 15 — Life on Land**

**IBM BOB** was used during the ideation and development process to support the creation and refinement of the solution.

---

## 📄 License

MIT License
