import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  AlertTriangle,
  Link2,
  XCircle,
} from "lucide-react";

import { terminologyConcepts } from "../data/mockTerminology";

function StatusBadge({ status }) {
  const config = {
    DIRECT_CODE_ALIGNMENT: {
      label: "Direct alignment",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },

    CROSS_CODE: {
      label: "Cross-code mapping",
      className: "border-blue-200 bg-blue-50 text-blue-700",
      icon: Link2,
    },

    FOUNDATION_ONLY: {
      label: "Foundation only",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: AlertTriangle,
    },

    UNMAPPED: {
      label: "Unmapped",
      className: "border-slate-200 bg-slate-100 text-slate-600",
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

function Mapping() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConcept, setSelectedConcept] = useState(
    terminologyConcepts[0]
  );

  const filteredConcepts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return terminologyConcepts;
    }

    return terminologyConcepts.filter((concept) =>
      [
        concept.namasteCode,
        concept.namasteTerm,
        concept.tm2Code,
        concept.tm2Term,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query)
        )
    );
  }, [searchTerm]);

  const handleSelect = (concept) => {
    setSelectedConcept(concept);
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Terminology Mapping
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Search NAMASTE concepts and review their ICD-11 TM2 mappings.
        </p>
      </div>

      {/* Search */}
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
          <Search
            size={18}
            className="absolute left-8 top-8 text-slate-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search NAMASTE concepts..."
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {searchTerm && (
            <div className="absolute left-5 right-5 top-[76px] z-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              {filteredConcepts.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {filteredConcepts.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => handleSelect(concept)}
                      className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {concept.namasteTerm}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NAMASTE · {concept.namasteCode}
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

      {/* Selected concept */}
      {selectedConcept && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Mapping result
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review the terminology relationship before confirmation.
              </p>
            </div>

            <StatusBadge status={selectedConcept.status} />
          </div>

          {/* Mapping cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            {/* NAMASTE */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                NAMASTE
              </p>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Code
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedConcept.namasteCode}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Concept
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.namasteTerm}
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                <ArrowRight
                  size={16}
                  className="hidden lg:block"
                />

                <ArrowRight
                  size={16}
                  className="rotate-90 lg:hidden"
                />
              </div>
            </div>

            {/* ICD-11 TM2 */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ICD-11 TM2
              </p>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Code
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedConcept.tm2Code || "Not available"}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Concept
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.tm2Term ||
                    "No classification concept available."}
                </p>
              </div>
            </div>
          </div>

          {/* Mapping details */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Mapping details
              </h2>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge status={selectedConcept.status} />
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Confidence
                </p>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedConcept.confidence
                    ? `${selectedConcept.confidence}%`
                    : "Not calculated"}
                </p>
              </div>

              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">
                  Source
                </p>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedConcept.source || "Not available"}
                </p>
              </div>
            </div>

            {selectedConcept.foundationUri && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-400">
                  WHO Foundation URI
                </p>

                <p className="mt-2 break-all font-mono text-xs text-slate-600">
                  {selectedConcept.foundationUri}
                </p>
              </div>
            )}
          </section>

          {/* Action */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {selectedConcept.status === "FOUNDATION_ONLY" ? (
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
            ) : selectedConcept.status === "UNMAPPED" ? (
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Mark for Manual Mapping
              </button>
            ) : (
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