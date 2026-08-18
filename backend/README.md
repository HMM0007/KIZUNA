# KIZUNA Backend

FastAPI prototype backend for terminology search, encounter persistence, and human review.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API documentation is available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

Health check:

- `GET /api/health`

Terminology:

- `GET /api/terminology/search?q=diabetes`
- `GET /api/terminology/{namaste_code}`

Encounters:

- `POST /api/encounters`
- `GET /api/encounters`
- `GET /api/encounters/{encounter_id}`

Reviews:

- `POST /api/reviews`
- `GET /api/reviews`

The prototype intentionally reads the existing terminology CSV from `frontend/public/data` so the backend and current UI use the same terminology source during this phase. Encounter and review records are stored in a local SQLite database created under `backend/kizuna.db`.
