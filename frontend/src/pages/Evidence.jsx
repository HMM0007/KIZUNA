import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Link2,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

import { searchTerminologyApi } from "../services/apiService";

const DEMO_CONCEPTS = ["osteoarthritis", "tremor", "contracture", "pelvic pain"];

const STATUS = {
  DIRECT_CODE_ALIGNMENT: { label: "Direct alignment", tone: "emerald", icon: CheckCircle2 },
  CROSS_CODE_MAPPING: { label: "Cross-code mapping", tone: "blue", icon: Link2 },
  FOUNDATION_CONCEPT_ONLY: { label: "Foundation concept only", tone: "amber", icon: AlertTriangle },
  UNMAPPED: { label: "Unmapped", tone: "slate", icon: XCircle },
};

function StatusBadge({ value }) {
  const config = STATUS[value] || STATUS.UNMAPPED;
  const Icon = config.icon;
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${styles[config.tone]}`}>
      <Icon size={14} /> {config.label}
    </span>
  );
}

function Field({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1.5 break-words text-sm text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function Evidence() {
  const [query, setQuery] = useState("");
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConcept = async (value) => {
    const q = value.trim();
    if (!q) return;
    try {
      setLoading(true);
      setError(null);
      const response = await searchTerminologyApi(q, 1);
      if (!response.results?.length) {
        setConcept(null);
        setError("No terminology concept found for this search.");
        return;
      }
      setConcept(response.results[0]);
      setQuery(q);
    } catch (err) {
      setError(err.message || "Unable to load mapping evidence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcept("tremor");
  }, []);

  const status = concept?.MAPPING_CLASS || "UNMAPPED";
  const confidence = concept?.CONFIDENCE !== undefined && concept?.CONFIDENCE !== ""
    ? `${(Number(concept.CONFIDENCE) * 100).toFixed(0)}%`
    : "Not calculated";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Mapping Evidence</h1>
          {concept && <StatusBadge value={status} />}
        </div>
        <p className="mt-1 text-sm text-slate-500">Trace the terminology relationship, classification state, confidence, and supporting source fields.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && loadConcept(query)}
            placeholder="Search a terminology concept..."
            className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-24 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
          <button type="button" onClick={() => loadConcept(query)} disabled={loading} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
            {loading ? "Loading..." : "Inspect"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Demo cases:</span>
          {DEMO_CONCEPTS.map((item) => (
            <button key={item} type="button" onClick={() => loadConcept(item)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50">
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && !concept ? (
        <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" /> Loading evidence...</div>
      ) : concept ? (
        <>
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NAMASTE source concept</p>
              <Field label="Code" value={concept.NAMASTE_CODE} mono />
              <div className="mt-5"><Field label="English term" value={concept.NAMASTE_ENGLISH} /></div>
              <div className="mt-5"><Field label="Terminology term" value={concept.NAMASTE_TERM} /></div>
              <div className="mt-5"><Field label="Diacritical term" value={concept.NAMASTE_TERM_DIACRITICAL} /></div>
              <div className="mt-5"><Field label="Devanagari term" value={concept.NAMASTE_TERM_DEVANAGARI} /></div>
            </div>

            <div className="flex items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-2"><span className="text-[10px] uppercase tracking-wide">relationship</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white"><ArrowRight size={16} /></div></div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2 / Foundation target</p>
              <Field label="TM2 code" value={concept.TM2_CODE} mono />
              <div className="mt-5"><Field label="TM2 term" value={concept.TM2_TERM} /></div>
              <div className="mt-5"><Field label="WHO URI" value={concept.TM2_URI} mono /></div>
              {!concept.TM2_CODE && <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">No classified TM2 code is present in this record. KIZUNA should not invent one.</div>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Traceability</h2><p className="mt-1 text-xs text-slate-500">Evidence returned directly from the terminology mapping API.</p></div>
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4"><Field label="Mapping class" value={STATUS[status]?.label || status} /></div>
              <div className="px-5 py-4"><Field label="Mapping status" value={concept.MAPPING_STATUS} /></div>
              <div className="px-5 py-4"><Field label="Confidence" value={confidence} /></div>
            </div>
            <div className="grid grid-cols-1 gap-5 border-t border-slate-100 p-5 md:grid-cols-2">
              <Field label="Relationship" value={concept.RELATIONSHIP} />
              <Field label="Source" value={concept.SOURCE} />
              <Field label="Dataset version" value={concept.VERSION} />
              <Field label="Biomedical code" value={concept.BIOMEDICAL_CODE} mono />
              <Field label="Biomedical term" value={concept.BIOMEDICAL_TERM} />
              <Field label="Primary NAMASTE code" value={concept.NAMASTE_PRIMARY_CODE} mono />
            </div>
          </section>

          {(concept.SHORT_DEFINITION || concept.LONG_DEFINITION) && (
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><FileText size={16} className="text-slate-400" /><h2 className="text-sm font-semibold text-slate-900">Definitions</h2></div></div>
              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                <Field label="Short definition" value={concept.SHORT_DEFINITION} />
                <Field label="Long definition" value={concept.LONG_DEFINITION} />
              </div>
            </section>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <Database size={16} className="shrink-0 text-slate-400" />
            Evidence is read through the Team Tenacious Interoperability API; the UI does not manufacture missing target codes or mapping evidence.
          </div>
        </>
      ) : null}
    </div>
  );
}

export default Evidence;
