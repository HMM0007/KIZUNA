from __future__ import annotations

import csv
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT_DIR / "frontend" / "public" / "data" / "namaste_prototype_300_tm2_clean.csv"
DB_FILE = Path(__file__).resolve().parents[1] / "kizuna.db"

app = FastAPI(
    title="KIZUNA API",
    version="0.1.0",
    description="Prototype API for terminology mapping, encounters, and human review.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EncounterCreate(BaseModel):
    patient_id: str = Field(min_length=1)
    diagnosis: str = Field(min_length=1)
    clinical_notes: str = ""
    namaste_code: str = ""
    namaste_term: str = ""
    namaste_english: str = ""
    tm2_code: str = ""
    tm2_term: str = ""
    mapping_class: str = "UNMAPPED"
    confidence: float | None = None
    source: str = ""


class ReviewCreate(BaseModel):
    encounter_id: int
    decision: str = Field(pattern="^(REVIEW|APPROVED|REJECTED)$")
    reviewer: str = "Clinical Reviewer"
    notes: str = ""


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS encounters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                diagnosis TEXT NOT NULL,
                clinical_notes TEXT NOT NULL DEFAULT '',
                namaste_code TEXT NOT NULL DEFAULT '',
                namaste_term TEXT NOT NULL DEFAULT '',
                namaste_english TEXT NOT NULL DEFAULT '',
                tm2_code TEXT NOT NULL DEFAULT '',
                tm2_term TEXT NOT NULL DEFAULT '',
                mapping_class TEXT NOT NULL DEFAULT 'UNMAPPED',
                confidence REAL,
                source TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                encounter_id INTEGER NOT NULL,
                decision TEXT NOT NULL,
                reviewer TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                reviewed_at TEXT NOT NULL,
                FOREIGN KEY (encounter_id) REFERENCES encounters(id)
            )
            """
        )
        connection.commit()


def load_terminology() -> list[dict[str, str]]:
    if not DATA_FILE.exists():
        raise HTTPException(status_code=500, detail="Terminology dataset is unavailable.")

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def normalize(value: Any) -> str:
    return str(value or "").strip().lower()


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/api/health", tags=["System"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kizuna-api", "version": app.version}


@app.get("/api/terminology/search", tags=["Terminology"])
def search_terminology(
    q: str = Query(min_length=1),
    limit: int = Query(default=12, ge=1, le=50),
) -> dict[str, Any]:
    query = normalize(q)
    results: list[dict[str, str]] = []

    # Search across the complete set of clinically useful terminology fields.
    # This includes source/target codes, English and Sanskrit terms, definitions,
    # biomedical references, and the relationship metadata used by the prototype.
    searchable_fields = (
        "NAMASTE_PRIMARY_CODE",
        "NAMASTE_CODE",
        "NAMASTE_TERM",
        "NAMASTE_ENGLISH",
        "NAMASTE_TERM_DIACRITICAL",
        "NAMASTE_TERM_DEVANAGARI",
        "TM2_CODE",
        "TM2_TERM",
        "SHORT_DEFINITION",
        "LONG_DEFINITION",
        "BIOMEDICAL_CODE",
        "BIOMEDICAL_TERM",
        "RELATIONSHIP",
    )

    for concept in load_terminology():
        if any(query in normalize(concept.get(field)) for field in searchable_fields):
            results.append(concept)
        if len(results) >= limit:
            break

    return {"query": q, "count": len(results), "results": results}


@app.get("/api/terminology/{namaste_code}", tags=["Terminology"])
def get_terminology(namaste_code: str) -> dict[str, Any]:
    for concept in load_terminology():
        if normalize(concept.get("NAMASTE_CODE")) == normalize(namaste_code):
            return concept
    raise HTTPException(status_code=404, detail="Terminology concept not found.")


@app.post("/api/encounters", status_code=201, tags=["Encounters"])
def create_encounter(payload: EncounterCreate) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    with db_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO encounters (
                patient_id, diagnosis, clinical_notes, namaste_code, namaste_term,
                namaste_english, tm2_code, tm2_term, mapping_class, confidence,
                source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.patient_id,
                payload.diagnosis,
                payload.clinical_notes,
                payload.namaste_code,
                payload.namaste_term,
                payload.namaste_english,
                payload.tm2_code,
                payload.tm2_term,
                payload.mapping_class,
                payload.confidence,
                payload.source,
                created_at,
            ),
        )
        connection.commit()
        encounter_id = cursor.lastrowid

    return {"id": encounter_id, "status": "created", "created_at": created_at}


@app.get("/api/encounters", tags=["Encounters"])
def list_encounters(patient_id: str | None = None) -> dict[str, Any]:
    with db_connection() as connection:
        if patient_id:
            rows = connection.execute(
                "SELECT * FROM encounters WHERE patient_id = ? ORDER BY id DESC",
                (patient_id,),
            ).fetchall()
        else:
            rows = connection.execute("SELECT * FROM encounters ORDER BY id DESC").fetchall()

    return {"count": len(rows), "results": [dict(row) for row in rows]}


@app.get("/api/encounters/{encounter_id}", tags=["Encounters"])
def get_encounter(encounter_id: int) -> dict[str, Any]:
    with db_connection() as connection:
        row = connection.execute(
            "SELECT * FROM encounters WHERE id = ?", (encounter_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Encounter not found.")
    return dict(row)


@app.post("/api/reviews", status_code=201, tags=["Reviews"])
def create_review(payload: ReviewCreate) -> dict[str, Any]:
    reviewed_at = datetime.now(timezone.utc).isoformat()

    with db_connection() as connection:
        encounter = connection.execute(
            "SELECT id FROM encounters WHERE id = ?", (payload.encounter_id,)
        ).fetchone()
        if encounter is None:
            raise HTTPException(status_code=404, detail="Encounter not found.")

        cursor = connection.execute(
            """
            INSERT INTO reviews (encounter_id, decision, reviewer, notes, reviewed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.encounter_id,
                payload.decision,
                payload.reviewer,
                payload.notes,
                reviewed_at,
            ),
        )
        connection.commit()

    return {"id": cursor.lastrowid, "status": "recorded", "reviewed_at": reviewed_at}


@app.get("/api/reviews", tags=["Reviews"])
def list_reviews() -> dict[str, Any]:
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                r.id, r.encounter_id, r.decision, r.reviewer, r.notes, r.reviewed_at,
                e.patient_id, e.diagnosis, e.namaste_code, e.namaste_english,
                e.tm2_code, e.tm2_term, e.mapping_class, e.confidence, e.source
            FROM reviews r
            JOIN encounters e ON e.id = r.encounter_id
            ORDER BY r.id DESC
            """
        ).fetchall()

    return {"count": len(rows), "results": [dict(row) for row in rows]}
