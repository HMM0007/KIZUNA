# Team Tenacious Interoperability API

FastAPI prototype for NAMASTE–ICD-11 TM2 terminology mapping, clinical encounter persistence, mapping evidence, and human review.

The repository/folder may remain named `KIZUNA`; this is only the user-facing API/product naming.

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

## API documentation

Open the interactive Swagger UI:

- `http://localhost:8000/docs`

Alternative ReDoc documentation:

- `http://localhost:8000/redoc`

Health check:

- `GET /api/health`

## Demo data

After starting the API once, run from the `backend` directory:

```bash
python seed_demo.py
```

The seeder is repeat-safe and uses clearly labelled `DEMO-*` patient IDs. It creates three representative encounter states:

1. Cross-code mapping with a TM2 target.
2. Foundation-only concept without a classified TM2 target.
3. Unmapped concept requiring human review.

It also creates example `APPROVED` and `REVIEW` decisions so the Review Queue and Dashboard can be demonstrated end-to-end.

## Endpoints

Terminology Mapping:

- `GET /api/terminology/search?q=...`
- `GET /api/terminology/{namaste_code}`

Encounters:

- `POST /api/encounters`
- `GET /api/encounters`
- `GET /api/encounters/{encounter_id}`

Human Review:

- `POST /api/reviews`
- `GET /api/reviews`

The prototype intentionally reads the existing terminology CSV from `frontend/public/data` so the backend and current UI use the same terminology source during this phase. Encounter and review records are stored in a local SQLite database created under `backend/kizuna.db`.
