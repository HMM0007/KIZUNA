from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_FILE = ROOT / "kizuna.db"

DEMO_ENCOUNTERS = [
    {
        "patient_id": "DEMO-001",
        "diagnosis": "Speech disorder",
        "clinical_notes": "Demo encounter for terminology mapping presentation.",
        "namaste_code": "SL07",
        "namaste_term": "Speech disorder",
        "namaste_english": "Speech disorder",
        "tm2_code": "MA80",
        "tm2_term": "Speech or language disturbances",
        "mapping_class": "CROSS_CODE_MAPPING",
        "confidence": 0.94,
        "source": "Prototype curated mapping",
    },
    {
        "patient_id": "DEMO-002",
        "diagnosis": "Foundation concept example",
        "clinical_notes": "Demo encounter showing a source concept without a classified TM2 target.",
        "namaste_code": "DEMO-F01",
        "namaste_term": "Foundation concept example",
        "namaste_english": "Foundation concept example",
        "tm2_code": "",
        "tm2_term": "",
        "mapping_class": "FOUNDATION_CONCEPT_ONLY",
        "confidence": None,
        "source": "Prototype curated mapping",
    },
    {
        "patient_id": "DEMO-003",
        "diagnosis": "Unmapped terminology example",
        "clinical_notes": "Demo encounter showing safe handling when no target mapping is available.",
        "namaste_code": "DEMO-U01",
        "namaste_term": "Unmapped terminology example",
        "namaste_english": "Unmapped terminology example",
        "tm2_code": "",
        "tm2_term": "",
        "mapping_class": "UNMAPPED",
        "confidence": None,
        "source": "Prototype curated mapping",
    },
]


def connection() -> sqlite3.Connection:
    db = sqlite3.connect(DB_FILE)
    db.row_factory = sqlite3.Row
    return db


def main() -> None:
    if not DB_FILE.exists():
        raise SystemExit("kizuna.db does not exist. Start the API once first so the database is initialized.")

    now = datetime.now(timezone.utc).isoformat()

    with connection() as db:
        inserted = []
        for item in DEMO_ENCOUNTERS:
            existing = db.execute(
                "SELECT id FROM encounters WHERE patient_id = ? AND namaste_code = ?",
                (item["patient_id"], item["namaste_code"]),
            ).fetchone()
            if existing:
                inserted.append(existing["id"])
                continue

            cursor = db.execute(
                """
                INSERT INTO encounters (
                    patient_id, diagnosis, clinical_notes, namaste_code, namaste_term,
                    namaste_english, tm2_code, tm2_term, mapping_class, confidence,
                    source, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["patient_id"], item["diagnosis"], item["clinical_notes"],
                    item["namaste_code"], item["namaste_term"], item["namaste_english"],
                    item["tm2_code"], item["tm2_term"], item["mapping_class"],
                    item["confidence"], item["source"], now,
                ),
            )
            inserted.append(cursor.lastrowid)

        approved_id = inserted[0]
        review_exists = db.execute(
            "SELECT id FROM reviews WHERE encounter_id = ? AND decision = 'APPROVED'",
            (approved_id,),
        ).fetchone()
        if not review_exists:
            db.execute(
                """
                INSERT INTO reviews (encounter_id, decision, reviewer, notes, reviewed_at)
                VALUES (?, 'APPROVED', 'Demo Reviewer', 'Demo approval for presentation flow.', ?)
                """,
                (approved_id, now),
            )

        review_id = inserted[2]
        review_exists = db.execute(
            "SELECT id FROM reviews WHERE encounter_id = ? AND decision = 'REVIEW'",
            (review_id,),
        ).fetchone()
        if not review_exists:
            db.execute(
                """
                INSERT INTO reviews (encounter_id, decision, reviewer, notes, reviewed_at)
                VALUES (?, 'REVIEW', 'Demo Reviewer', 'Kept in review because no target mapping is available.', ?)
                """,
                (review_id, now),
            )

        db.commit()

    print("KIZUNA demo data is ready.")
    print(f"Encounter IDs: {inserted}")
    print("Demo data uses DEMO-* patient IDs and is safe to distinguish from real records.")


if __name__ == "__main__":
    main()
