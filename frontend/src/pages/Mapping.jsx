import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  AlertTriangle,
  Link2,
  XCircle,
  Loader2,
  Database,
  ExternalLink,
} from "lucide-react";

import { searchTerminologyApi } from "../services/apiService";

const STATUS_CONFIG = {
  DIRECT_CODE_ALIGNMENT: {
    label: "Direct alignment",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  CROSS_CODE_MAPPING: {
    label: "Cross-code mapping",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Link2,
  },
  FOUNDATION_CONCEPT_ONLY: {
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

function StatusBadge({ status }) {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.UNMAPPED;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${current.className}`}>
      <Icon size={14} strokeWidth={1.8} />
      {current.label}
    </span>
  );
}

function Mapping() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setResults([]);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await searchTerminologyApi(query, 12);
        if (cancelled) return;

        setResults(response.results || []);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(err.message || "Unable to search terminology.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSelect = (concept) => {
    setSelectedConcept(concept);
    setSearchTerm("");
    setResults([]);
  };

  const confidence =
    selectedConcept?.CONFIDENCE !== undefined &&
    selectedConcept?.CONFIDENCE !== null &&
    selectedConcept?.CONFIDENCE !== ""
      ? `${(Number(selectedConcept.CONFIDENCE) * 100).toFixed(0)}%`
      : "Not calculated";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Terminology Mapping</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search NAMASTE concepts through the Team Tenacious Interoperability API and review their ICD-11 TM2 mappings.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Database size={14} />
        <span>Terminology source: Interoperability API</span>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Search terminology</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search by concept name, NAMASTE code, TM2 code, definition, or biomedical reference.
          </p>
        </div>

        <div className="relative p-5">
          <Search size={18} className="absolute left-8 top-8 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try osteoarthritis, tremor, contracture, or pelvic pain..."
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {loading && (
            <Loader2 size={17} className="absolute right-8 top-8 animate-spin text-slate-400" />
          )}

          {searchTerm && (
            <div className="absolute left-5 right-5 top-[76px] z-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
              {error ? (
                <div className="px-4 py-5 text-sm text-red-600">{error}</div>
              ) : results.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {results.map((concept, index) => (
                    <button
                      key={concept.NAMASTE_CODE || `${concept.NAMASTE_ENGLISH}-${index}`}
                      type="button"
                      onClick={() => handleSelect(concept)}
                      className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "Unnamed concept"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>NAMASTE · {concept.NAMASTE_CODE || "—"}</span>
                          <span>TM2 · {concept.TM2_CODE || "Not classified"}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="ml-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : !loading ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">No matching concepts found.</div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {selectedConcept ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Mapping result</h2>
              <p className="mt-1 text-xs text-slate-500">Returned directly by the terminology API.</p>
            </div>
            <StatusBadge status={selectedConcept.MAPPING_CLASS} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">Code</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{selectedConcept.NAMASTE_CODE || "Not available"}</p>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">Concept</p>
                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM || "Concept name unavailable"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Mapped to</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">Classified code</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{selectedConcept.TM2_CODE || "Not available"}</p>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">Concept</p>
                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {selectedConcept.TM2_TERM || "No classified TM2 concept available."}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Mapping details</h2>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">Status</p>
                <div className="mt-2"><StatusBadge status={selectedConcept.MAPPING_CLASS} /></div>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">Confidence</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{confidence}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">Relationship</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedConcept.RELATIONSHIP || "Not specified"}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400">Source</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedConcept.SOURCE || "Not available"}</p>
              </div>
            </div>

            {selectedConcept.TM2_URI && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-400">WHO Foundation / TM2 URI</p>
                <a
                  href={selectedConcept.TM2_URI}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 break-all font-mono text-xs text-slate-600 hover:text-slate-900"
                >
                  {selectedConcept.TM2_URI}
                  <ExternalLink size={13} className="shrink-0" />
                </a>
              </div>
            )}

            {(selectedConcept.SHORT_DEFINITION || selectedConcept.LONG_DEFINITION) && (
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-5 md:grid-cols-2">
                {selectedConcept.SHORT_DEFINITION && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Short definition</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{selectedConcept.SHORT_DEFINITION}</p>
                  </div>
                )}
                {selectedConcept.LONG_DEFINITION && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Long definition</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{selectedConcept.LONG_DEFINITION}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <p className="text-xs text-slate-500">
              {selectedConcept.MAPPING_CLASS === "FOUNDATION_CONCEPT_ONLY"
                ? "A Foundation concept is present, but no classified ICD-11 TM2 code is available in this record."
                : selectedConcept.MAPPING_CLASS === "UNMAPPED"
                  ? "No usable NAMASTE → ICD-11 TM2 mapping is available in this record."
                  : "Mapping evidence is preserved by the API for traceability."}
            </p>
            <a
              href="/mapping/evidence"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Mapping Evidence
            </a>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Search size={22} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Search for a terminology concept</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Try one of the four SIH demo cases: osteoarthritis, tremor, contracture, or pelvic pain.
          </p>
        </div>
      )}
    </div>
  );
}

export default Mapping;
