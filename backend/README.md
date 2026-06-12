# Backend FastAPI (Gemini)

## 1) Setup

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 2) Configure Gemini key

Use the existing `.env` file in this folder and set:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## 3) Run API

```bash
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 4) Endpoints

- `GET /api/health`
- `POST /api/schema/extract`
- `POST /api/schema/generate-example`
- `POST /api/dataset/generate`

The frontend is already configured to call `/api/*` and Vite proxies it to `http://localhost:8000`.
