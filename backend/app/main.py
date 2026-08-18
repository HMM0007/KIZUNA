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
    title="Team Tenacious Interoperability API",
    version="0.1.0",
    description="REST API for NAMASTE–ICD-11 TM2 terminology mapping, clinical encounter integration, mapping evidence, and human review.",
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
    tm2_uri: str = ""
    mapping_class: str = "UNMAPPED"
    mapping_status: str = "UNMAPPED"
    relationship: str = ""
    confidence: float | None = None
    source: str = ""
    version: str = ""
    biomedical_code: str = ""
    biomedical_term: str = ""
    short_definition: str = ""
    long_definition: str = ""
    namaste_term_diacritical: str = ""
    namaste_term_devanagari: str = ""


class ReviewCreate(BaseModel):
    encounter_id: int
    decision: str = Field(pattern="^(REVIEW|APPROVED|REJECTED)$")
    reviewer: str = "Clinical Reviewer"
    notes: str = ""


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def ensure_column(connection: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {row[1] for row in connection.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in columns:
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


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
                tm2_uri TEXT NOT NULL DEFAULT '',
                mapping_class TEXT NOT NULL DEFAULT 'UNMAPPED',
                mapping_status TEXT NOT NULL DEFAULT 'UNMAPPED',
                relationship TEXT NOT NULL DEFAULT '',
                confidence REAL,
                source TEXT NOT NULL DEFAULT '',
                version TEXT NOT NULL DEFAULT '',
                biomedical_code TEXT NOT NULL DEFAULT '',
                biomedical_term TEXT NOT NULL DEFAULT '',
                short_definition TEXT NOT NULL DEFAULT '',
                long_definition TEXT NOT NULL DEFAULT '',
                namaste_term_diacritical TEXT NOT NULL DEFAULT '',
                namaste_term_devanagari TEXT NOT NULL DEFAULT '',
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
        migrations = {
            "tm2_uri": "TEXT NOT NULL DEFAULT ''",
            "mapping_status": "TEXT NOT NULL DEFAULT 'UNMAPPED'",
            "relationship": "TEXT NOT NULL DEFAULT ''",
            "version": "TEXT NOT NULL DEFAULT ''",
            "biomedical_code": "TEXT NOT NULL DEFAULT ''",
            "biomedical_term": "TEXT NOT NULL DEFAULT ''",
            "short_definition": "TEXT NOT NULL DEFAULT ''",
            "long_definition": "TEXT NOT NULL DEFAULT ''",
            "namaste_term_diacritical": "TEXT NOT NULL DEFAULT ''",
            "namaste_term_devanagari": "TEXT NOT NULL DEFAULT ''",
        }
        for column, definition in migrations.items():
            ensure_column(connection, "encounters", column, definition)
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
    return {"status": "ok", "service": "team-tenacious-interoperability-api", "version": app.version}


@app.get("/api/terminology", tags=["Terminology Mapping"])
def list_terminology(
    limit: int = Query(default=300, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    concepts = load_terminology()
    results = concepts[offset : offset + limit]
    return {
        "count": len(results),
        "total": len(concepts),
        "offset": offset,
        "limit": limit,
        "results": results,
    }


@app.get("/api/terminology/search", tags=["Terminology Mapping"])
def search_terminology(
    q: str = Query(min_length=1),
    limit: int = Query(default=12, ge=1, le=50),
) -> dict[str, Any]:
    query = normalize(q)
    results: list[dict[str, str]] = []
    searchable_fields = (
        "NAMASTE_PRIMARY_CODE", "NAMASTE_CODE", "NAMASTE_TERM", "NAMASTE_ENGLISH",
        "NAMASTE_TERM_DIACRITICAL", "NAMASTE_TERM_DEVANAGARI", "TM2_CODE", "TM2_TERM",
        "SHORT_DEFINITION", "LONG_DEFINITION", "BIOMEDICAL_CODE", "BIOMEDICAL_TERM", "RELATIONSHIP",
    )
    for concept in load_terminology():
        if any(query in normalize(concept.get(field)) for field in searchable_fields):
            results.append(concept)
        if len(results) >= limit:
            break
    return {"query": q, "count": len(results), "results": results}


@app.get("/api/terminology/{namaste_code}", tags=["Terminology Mapping"])
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
                patient_id, diagnosis, clinical_notes, namaste_code, namaste_term, namaste_english,
                tm2_code, tm2_term, tm2_uri, mapping_class, mapping_status, relationship, confidence,
                source, version, biomedical_code, biomedical_term, short_definition, long_definition,
                namaste_term_diacritical, namaste_term_devanagari, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.patient_id, payload.diagnosis, payload.clinical_notes, payload.namaste_code,
                payload.namaste_term, payload.namaste_english, payload.tm2_code, payload.tm2_term,
                payload.tm2_uri, payload.mapping_class, payload.mapping_status, payload.relationship,
                payload.confidence, payload.source, payload.version, payload.biomedical_code,
                payload.biomedical_term, payload.short_definition, payload.long_definition,
                payload.namaste_term_diacritical, payload.namaste_term_devanagari, created_at,
            ),
        )
        connection.commit()
        encounter_id = cursor.lastrowid
    return {"id": encounter_id, "status": "created", "created_at": created_at}


@app.get("/api/encounters", tags=["Encounters"])
def list_encounters(patient_id: str | None = None) -> dict[str, Any]:
    with db_connection() as connection:
        if patient_id:
            rows = connection.execute("SELECT * FROM encounters WHERE patient_id = ? ORDER BY id DESC", (patient_id,)).fetchall()
        else:
            rows = connection.execute("SELECT * FROM encounters ORDER BY id DESC").fetchall()
    return {"count": len(rows), "results": [dict(row) for row in rows]}


@app.get("/api/encounters/{encounter_id}", tags=["Encounters"])
def get_encounter(encounter_id: int) -> dict[str, Any]:
    with db_connection() as connection:
        row = connection.execute("SELECT * FROM encounters WHERE id = ?", (encounter_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Encounter not found.")
    return dict(row)


@app.post("/api/reviews", status_code=201, tags=["Human Review"])
def create_review(payload: ReviewCreate) -> dict[str, Any]:
    reviewed_at = datetime.now(timezone.utc).isoformat()
    with db_connection() as connection:
        encounter = connection.execute("SELECT id FROM encounters WHERE id = ?", (payload.encounter_id,)).fetchone()
        if encounter is None:
            raise HTTPException(status_code=404, detail="Encounter not found.")
        cursor = connection.execute(
            "INSERT INTO reviews (encounter_id, decision, reviewer, notes, reviewed_at) VALUES (?, ?, ?, ?, ?)",
            (payload.encounter_id, payload.decision, payload.reviewer, payload.notes, reviewed_at),
        )
        connection.commit()
    return {"id": cursor.lastrowid, "status": "recorded", "reviewed_at": reviewed_at}


def review_query(select: str, where: str = "", params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_connection() as connection:
        rows = connection.execute(
            f"""
            {select}
            FROM encounters e
            LEFT JOIN reviews r ON r.id = (
                SELECT r2.id FROM reviews r2
                WHERE r2.encounter_id = e.id
                ORDER BY r2.id DESC LIMIT 1
            )
            {where}
            ORDER BY e.id DESC
            """,
            params,
        ).fetchall()
    return [dict(row) for row in rows]


REVIEWABLE_SQL = "e.mapping_class IN ('FOUNDATION_CONCEPT_ONLY', 'UNMAPPED')"
REVIEWED_SQL = "r.decision IN ('APPROVED', 'REJECTED')"
PENDING_SQL = f"({REVIEWABLE_SQL}) AND (r.id IS NULL OR r.decision = 'REVIEW')"

REVIEW_SELECT = """
SELECT e.*, r.id AS review_id, r.decision AS review_decision,
       r.reviewer AS review_reviewer, r.notes AS review_notes,
       r.reviewed_at AS review_reviewed_at
"""


@app.get("/api/reviews/pending", tags=["Human Review"])
def list_pending_reviews() -> dict[str, Any]:
    results = review_query(REVIEW_SELECT, f"WHERE {PENDING_SQL}")
    return {"count": len(results), "results": results}


@app.get("/api/reviews", tags=["Human Review"])
def list_reviews() -> dict[str, Any]:
    results = review_query(REVIEW_SELECT, f"WHERE {REVIEWABLE_SQL} AND {REVIEWED_SQL}")
    return {"count": len(results), "results": results}


@app.get("/api/analytics/summary", tags=["Analytics"])
def analytics_summary() -> dict[str, Any]:
    with db_connection() as connection:
        total = connection.execute("SELECT COUNT(*) FROM encounters").fetchone()[0]
        mapping_rows = connection.execute(
            "SELECT mapping_class, COUNT(*) AS count FROM encounters GROUP BY mapping_class"
        ).fetchall()
        review_rows = connection.execute(
            """
            SELECT r.decision, COUNT(*) AS count
            FROM reviews r
            JOIN (
                SELECT encounter_id, MAX(id) AS latest_id
                FROM reviews
                GROUP BY encounter_id
            ) latest ON latest.latest_id = r.id
            GROUP BY r.decision
            """
        ).fetchall()
        pending = connection.execute(
            f"""
            SELECT COUNT(*) FROM encounters e
            LEFT JOIN reviews r ON r.id = (
                SELECT r2.id FROM reviews r2
                WHERE r2.encounter_id = e.id
                ORDER BY r2.id DESC LIMIT 1
            )
            WHERE {PENDING_SQL}
            """
        ).fetchone()[0]

    mapping = {row["mapping_class"]: row["count"] for row in mapping_rows}
    reviews = {row["decision"]: row["count"] for row in review_rows}
    mapped = mapping.get("DIRECT_CODE_ALIGNMENT", 0) + mapping.get("CROSS_CODE_MAPPING", 0)

    return {
        "total_encounters": total,
        "mapped_encounters": mapped,
        "mapped_rate": round((mapped / total) * 100, 1) if total else 0,
        "review_required": pending,
        "mapping_distribution": {
            "DIRECT_CODE_ALIGNMENT": mapping.get("DIRECT_CODE_ALIGNMENT", 0),
            "CROSS_CODE_MAPPING": mapping.get("CROSS_CODE_MAPPING", 0),
            "FOUNDATION_CONCEPT_ONLY": mapping.get("FOUNDATION_CONCEPT_ONLY", 0),
            "UNMAPPED": mapping.get("UNMAPPED", 0),
        },
        "review_distribution": {
            "PENDING": pending,
            "APPROVED": reviews.get("APPROVED", 0),
            "REJECTED": reviews.get("REJECTED", 0),
            "REVIEW": reviews.get("REVIEW", 0),
        },
    }
