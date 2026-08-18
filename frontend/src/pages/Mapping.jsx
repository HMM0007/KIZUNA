import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  AlertTriangle,
  Link2,
  XCircle,
  Loader2,
  Database,
} from "lucide-react";

import { loadTerminology } from "../services/terminologyService";

/* ---------------------------------------------------------
   STATUS BADGE
--------------------------------------------------------- */

function StatusBadge({ status }) {
  const config = {
    DIRECT_CODE_ALIGNMENT: {
      label: "Direct alignment",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },

    CROSS_CODE_MAPPING: {
      label: "Cross-code mapping",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: Link2,
    },

    FOUNDATION_CONCEPT_ONLY: {
      label: "Foundation only",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: AlertTriangle,
    },

    UNMAPPED: {
      label: "Unmapped",
      className:
        "border-slate-200 bg-slate-100 text-slate-600",
      icon: XCircle,
    },
  };

  const current = config[status] || config.UNMAPPED;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${current.className}`}
    >
      <Icon size={14} strokeWidth={1.8} />
      {current.label}
    </span>
  );
}

/* ---------------------------------------------------------
   MAIN MAPPING PAGE
--------------------------------------------------------- */

function Mapping() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConcept, setSelectedConcept] = useState(null);

  /* -------------------------------------------------------
     LOAD CSV DATA
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const data = await loadTerminology();

        setConcepts(data);

        if (data.length > 0) {
          setSelectedConcept(data[0]);
        }
      } catch (err) {
        console.error("Terminology loading error:", err);

        setError(
          "Unable to load the terminology dataset. Please check that the CSV file is available."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  const filteredConcepts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    /*
      When there is no search query, show the first
      20 concepts only.
    */
    if (!query) {
      return concepts.slice(0, 20);
    }

    return concepts
      .filter((concept) => {
        const searchableFields = [
          concept.NAMASTE_CODE,
          concept.NAMASTE_TERM,
          concept.NAMASTE_ENGLISH,
          concept.TM2_CODE,
          concept.TM2_TERM,
        ];

        return searchableFields
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );
      })
      .slice(0, 20);
  }, [concepts, searchTerm]);

  /* -------------------------------------------------------
     SELECT CONCEPT
  ------------------------------------------------------- */

  const handleSelect = (concept) => {
    setSelectedConcept(concept);
    setSearchTerm("");
  };

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading terminology dataset...
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     ERROR STATE
  ------------------------------------------------------- */

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Terminology Mapping
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Search NAMASTE concepts and review their ICD-11 TM2 mappings.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <XCircle
              size={20}
              className="mt-0.5 text-red-500"
            />

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Dataset could not be loaded
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     MAIN UI
  ------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------
          PAGE HEADING
      --------------------------------------------------- */}

      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Terminology Mapping
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search NAMASTE concepts and review their ICD-11 TM2 mappings.
        </p>
      </div>

      {/* ---------------------------------------------------
          DATASET INFO
      --------------------------------------------------- */}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Database size={14} />

        <span>
          Prototype terminology dataset · {concepts.length} concepts
        </span>
      </div>

      {/* ---------------------------------------------------
          SEARCH SECTION
      --------------------------------------------------- */}

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Search terminology
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Search by NAMASTE code or concept name.
          </p>
        </div>

        <div className="relative p-5">
          {/* Search icon */}

          <Search
            size={18}
            className="absolute left-8 top-8 text-slate-400"
          />

          {/* Search input */}

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search NAMASTE concepts..."
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {/* ------------------------------------------------
              SEARCH RESULTS
          ------------------------------------------------ */}

          {searchTerm && (
            <div className="absolute left-5 right-5 top-[76px] z-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              {filteredConcepts.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {filteredConcepts.map((concept, index) => (
                    <button
                      key={
                        concept.NAMASTE_CODE ||
                        `${concept.NAMASTE_ENGLISH}-${index}`
                      }
                      type="button"
                      onClick={() => handleSelect(concept)}
                      className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {concept.NAMASTE_ENGLISH ||
                            concept.NAMASTE_TERM ||
                            "Unnamed concept"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NAMASTE ·{" "}
                          {concept.NAMASTE_CODE ||
                            "Code unavailable"}
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="ml-4 shrink-0 text-slate-400"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No matching concepts found.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------
          SELECTED CONCEPT
      --------------------------------------------------- */}

      {selectedConcept && (
        <>
          {/* Mapping heading */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Mapping result
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review the terminology relationship before confirmation.
              </p>
            </div>

            <StatusBadge
              status={selectedConcept.MAPPING_CLASS}
            />
          </div>

          {/* ------------------------------------------------
              MAPPING CARDS
          ------------------------------------------------ */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            {/* ----------------------------------------------
                NAMASTE CARD
            ---------------------------------------------- */}

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                NAMASTE
              </p>

              {/* Code */}

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Code
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedConcept.NAMASTE_CODE ||
                    "Not available"}
                </p>
              </div>

              {/* Concept */}

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Concept
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.NAMASTE_ENGLISH ||
                    selectedConcept.NAMASTE_TERM ||
                    "Concept name unavailable"}
                </p>
              </div>
            </div>

            {/* ----------------------------------------------
                CONNECTION
            ---------------------------------------------- */}

            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Mapped to
                </span>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                  {/* Desktop */}

                  <ArrowRight
                    size={16}
                    className="hidden lg:block"
                  />

                  {/* Mobile */}

                  <ArrowRight
                    size={16}
                    className="rotate-90 lg:hidden"
                  />
                </div>
              </div>
            </div>

            {/* ----------------------------------------------
                ICD-11 TM2 CARD
            ---------------------------------------------- */}

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ICD-11 TM2
              </p>

              {/* Code */}

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Code
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedConcept.TM2_CODE ||
                    "Not available"}
                </p>
              </div>

              {/* Concept */}

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Concept
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.TM2_TERM ||
                    "No classification concept available."}
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------
              MAPPING DETAILS
          ------------------------------------------------ */}

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Mapping details
              </h2>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {/* Status */}

              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={selectedConcept.MAPPING_CLASS}
                  />
                </div>
              </div>

              {/* Confidence */}

              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Confidence
                </p>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedConcept.CONFIDENCE !==
                    undefined &&
                  selectedConcept.CONFIDENCE !== null &&
                  selectedConcept.CONFIDENCE !== ""
                    ? `${(
                        Number(
                          selectedConcept.CONFIDENCE
                        ) * 100
                      ).toFixed(0)}%`
                    : "Not calculated"}
                </p>
              </div>

              {/* Source */}

              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Source
                </p>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedConcept.SOURCE ||
                    "Not available"}
                </p>
              </div>
            </div>

            {/* ------------------------------------------------
                WHO URI
            ------------------------------------------------ */}

            {selectedConcept.TM2_URI && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-400">
                  WHO Foundation / TM2 URI
                </p>

                <p className="mt-2 break-all font-mono text-xs text-slate-600">
                  {selectedConcept.TM2_URI}
                </p>
              </div>
            )}
          </section>

          {/* ------------------------------------------------
              ACTION AREA
          ------------------------------------------------ */}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {/* FOUNDATION ONLY */}

            {selectedConcept.MAPPING_CLASS ===
            "FOUNDATION_CONCEPT_ONLY" ? (
              <>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Keep NAMASTE Only
                </button>

                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Send for Review
                </button>
              </>
            ) : /* UNMAPPED */

            selectedConcept.MAPPING_CLASS ===
              "UNMAPPED" ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Mark for Manual Mapping
              </button>
            ) : /* DIRECT / CROSS CODE */

            (
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Confirm Mapping
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Mapping;