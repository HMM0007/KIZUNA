import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Filter,
  Link2,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

import { loadTerminology } from "../services/terminologyService";

const REVIEW_STORAGE_KEY = "kizuna-review-decisions";

const statusConfig = {
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
  const config = statusConfig[status] || statusConfig.UNMAPPED;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function ReviewQueue() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [decisions, setDecisions] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTerminology();
        setConcepts(data);

        try {
          const stored = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "{}");
          setDecisions(stored);
        } catch {
          setDecisions({});
        }
      } catch (err) {
        console.error("Review queue dataset error:", err);
        setError("Unable to load the terminology dataset.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const reviewableConcepts = useMemo(() => {
    return concepts.filter((concept) => {
      const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS;
      return status === "FOUNDATION_CONCEPT_ONLY" || status === "UNMAPPED";
    });
  }, [concepts]);

  const filteredConcepts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reviewableConcepts.filter((concept) => {
      const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";
      const decision = decisions[concept.NAMASTE_CODE];

      if (filter !== "ALL") {
        if (filter === "PENDING" && decision) return false;
        if (filter === "REVIEWED" && !decision) return false;
        if (filter === "FOUNDATION" && status !== "FOUNDATION_CONCEPT_ONLY") return false;
        if (filter === "UNMAPPED" && status !== "UNMAPPED") return false;
      }

      if (!query) return true;

      return [
        concept.NAMASTE_CODE,
        concept.NAMASTE_TERM,
        concept.NAMASTE_ENGLISH,
        concept.TM2_CODE,
        concept.TM2_TERM,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [reviewableConcepts, searchTerm, filter, decisions]);

  const pendingCount = reviewableConcepts.filter((concept) => !decisions[concept.NAMASTE_CODE]).length;
  const reviewedCount = reviewableConcepts.length - pendingCount;
  const foundationCount = reviewableConcepts.filter((concept) => (concept.MAPPING_CLASS || concept.MAPPING_STATUS) === "FOUNDATION_CONCEPT_ONLY").length;
  const unmappedCount = reviewableConcepts.filter((concept) => (concept.MAPPING_CLASS || concept.MAPPING_STATUS) === "UNMAPPED").length;

  const saveDecision = (concept, decision) => {
    const code = concept.NAMASTE_CODE;
    const next = {
      ...decisions,
      [code]: {
        decision,
        decidedAt: new Date().toISOString(),
        conceptName: concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM,
      },
    };

    setDecisions(next);
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading review queue...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <XCircle size={20} className="mt-0.5 text-red-500" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Review queue unavailable</h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Review Queue</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review terminology concepts that cannot safely be auto-confirmed.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            <Database size={14} /> Prototype dataset · {concepts.length} concepts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Pending review</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Reviewed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{reviewedCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700">Foundation only</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">{foundationCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Unmapped</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{unmappedCount}</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search concept, NAMASTE code or ICD-11 code..."
                className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">All review items</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="FOUNDATION">Foundation only</option>
                <option value="UNMAPPED">Unmapped</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredConcepts.slice(0, 40).map((concept) => {
            const code = concept.NAMASTE_CODE;
            const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";
            const decision = decisions[code];
            const conceptName = concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "Unnamed concept";

            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelected(concept)}
                className="w-full px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{conceptName}</p>
                      <StatusBadge status={status} />
                      {decision && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 size={12} /> {decision.decision === "ACCEPT" ? "Accepted" : "Reviewed"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono">NAMASTE · {code}</span>
                      {concept.TM2_CODE && <><span className="text-slate-300">→</span><span className="font-mono">ICD-11 TM2 · {concept.TM2_CODE}</span></>}
                      {concept.CONFIDENCE && <span>Confidence · {(Number(concept.CONFIDENCE) * 100).toFixed(0)}%</span>}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Open review →</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredConcepts.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardCheck size={24} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No review items found</p>
            <p className="mt-1 text-xs text-slate-400">Try changing the search or filter.</p>
          </div>
        )}

        {filteredConcepts.length > 40 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Showing first 40 matching concepts for the prototype.
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clinical review</p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">{selected.NAMASTE_ENGLISH || selected.NAMASTE_TERM}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-500">NAMASTE · {selected.NAMASTE_CODE}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close review">✕</button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selected.NAMASTE_ENGLISH || selected.NAMASTE_TERM || "Unavailable"}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{selected.NAMASTE_CODE}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selected.TM2_TERM || "No classified mapping"}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{selected.TM2_CODE || "Code unavailable"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Status</p><div className="mt-2"><StatusBadge status={selected.MAPPING_CLASS || selected.MAPPING_STATUS} /></div></div>
                <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Confidence</p><p className="mt-2 text-sm font-medium text-slate-800">{selected.CONFIDENCE ? `${(Number(selected.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated"}</p></div>
                <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Source</p><p className="mt-2 text-sm font-medium text-slate-800">{selected.SOURCE || "Not available"}</p></div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Link2 size={17} className="mt-0.5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Reviewer guidance</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Confirm only when the clinical meaning and terminology relationship are appropriate. For foundation-only concepts, the WHO reference may exist without a classified TM2 code; do not invent a target code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => saveDecision(selected, "REJECT")} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><XCircle size={15} /> Keep for review</button>
                <button type="button" onClick={() => saveDecision(selected, "ACCEPT")} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><CheckCircle2 size={15} /> Mark reviewed</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewQueue;
