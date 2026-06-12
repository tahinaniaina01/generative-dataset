# Dataset Generative (Frontend + FastAPI + Gemini)

Web application to generate datasets with Gemini, including:

- Frontend in React + Vite + TypeScript
- Backend in FastAPI (proxy to the Gemini API)

## Architecture

```text
dataset_generative/
├── frontend/   # UI React
└── backend/    # API FastAPI + integration Gemini
```

## Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- A valid Gemini API key

## Configuration

In `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` is optional. The default value is `gemini-2.5-flash`.

## Installation

### 1) Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 2) Frontend

```bash
cd frontend
npm install
```

## Run Locally

Run backend and frontend in two separate terminals.

### Terminal 1: Backend

```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`

The frontend calls `/api/*`, and Vite automatically proxies requests to `http://localhost:8000`.

## Backend Endpoints

- `GET /api/health`
  - Returns `status` and `gemini_configured`
- `POST /api/schema/extract`
- `POST /api/schema/generate-example`
- `POST /api/dataset/generate`

## Quick Gemini API Key Check

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
	-H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Say just OK"}]}]}'
```

If this returns JSON with a text response, your key and model are working.

## Common Errors

- `502 Bad Gateway` on `/api/dataset/generate`
  - The backend could not get a usable response from Gemini.
  - Check the API key, model name, and network connectivity.
- `404 model not found`
  - The model name is not supported. Use a current model (for example: `gemini-2.5-flash`).
- `500 GEMINI_API_KEY is missing`
  - The `GEMINI_API_KEY` variable is not set in `backend/.env`.

## Useful Frontend Commands

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Security

- Never commit a real API key.
- If a key is exposed, rotate/regenerate it immediately.
