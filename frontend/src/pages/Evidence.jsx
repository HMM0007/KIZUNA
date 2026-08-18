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
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[config.tone]}`}><Icon size={14} />{config.label}</span>;
}

function Field({ label, value, mono = false }) {
  if (!value) return null;
  return <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className={`mt-1.5 break-words text-sm text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</p></div>;
}

function Evidence() {
  const [query, setQuery] = useState("");
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inspect = async (value) => {
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

  useEffect(() => { inspect("tremor"); }, []);

  const status = concept?.MAPPING_CLASS || "UNMAPPED";
  const confidence = concept?.CONFIDENCE !== undefined && concept?.CONFIDENCE !== "" ? `${Math.round(Number(concept.CONFIDENCE) * 100)}%` : "Not calculated";
  const sourceName = concept?.NAMASTE_ENGLISH || concept?.NAMASTE_TERM || "Unnamed concept";

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-50" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Traceability</span>{concept && <StatusBadge value={status} />}</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Mapping Evidence</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Inspect exactly what the interoperability service knows about a terminology relationship, without fabricating missing codes.</p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && inspect(query)} placeholder="Search diagnosis, NAMASTE code or terminology term..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50" /></div>
          <button type="button" onClick={() => inspect(query)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? "Inspecting" : "Inspect mapping"}</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] font-medium text-slate-400">Demo:</span>{DEMO_CONCEPTS.map((item) => <button key={item} type="button" onClick={() => inspect(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">{item}</button>)}</div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {loading && !concept ? <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading evidence...</div> : concept && <>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_64px_1fr]">
          <div className="surface-lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Source</p><h2 className="mt-2 text-lg font-semibold text-slate-950">NAMASTE</h2></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600">{concept.NAMASTE_CODE || "—"}</span></div>
            <p className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{sourceName}</p>
            <div className="mt-5 space-y-4"><Field label="Terminology term" value={concept.NAMASTE_TERM} /><Field label="Diacritical term" value={concept.NAMASTE_TERM_DIACRITICAL} /><Field label="Devanagari term" value={concept.NAMASTE_TERM_DEVANAGARI} /></div>
          </div>
          <div className="flex items-center justify-center"><div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"><ArrowRight size={18} className="text-slate-500" /></div></div>
          <div className="surface-lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Target</p><h2 className="mt-2 text-lg font-semibold text-slate-950">ICD-11 TM2</h2></div><span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-[11px] text-blue-700">{concept.TM2_CODE || "No code"}</span></div>
            <p className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{concept.TM2_TERM || "No classified target"}</p>
            <div className="mt-5 space-y-4"><Field label="Relationship" value={concept.RELATIONSHIP} /><Field label="WHO reference" value={concept.TM2_URI} mono /></div>
            {!concept.TM2_CODE && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800"><strong>No classified TM2 code.</strong> The service preserves the unresolved state instead of guessing a target.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-950">Traceability record</h2><p className="mt-1 text-xs text-slate-500">Evidence returned by the Team Tenacious Interoperability API.</p></div><StatusBadge value={status} /></div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4"><div className="bg-white p-5"><Field label="Confidence" value={confidence} /></div><div className="bg-white p-5"><Field label="Status" value={concept.MAPPING_STATUS} /></div><div className="bg-white p-5"><Field label="Source" value={concept.SOURCE} /></div><div className="bg-white p-5"><Field label="Dataset" value={concept.VERSION} /></div></div>
          <div className="grid grid-cols-1 gap-5 border-t border-slate-100 p-6 md:grid-cols-3"><Field label="Biomedical code" value={concept.BIOMEDICAL_CODE} mono /><Field label="Biomedical term" value={concept.BIOMEDICAL_TERM} /><Field label="Primary NAMASTE code" value={concept.NAMASTE_PRIMARY_CODE} mono /></div>
        </section>

        {(concept.SHORT_DEFINITION || concept.LONG_DEFINITION) && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><FileText size={16} className="text-slate-400" /><h2 className="text-sm font-semibold text-slate-950">Definitions</h2></div><div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2"><Field label="Short definition" value={concept.SHORT_DEFINITION} /><Field label="Long definition" value={concept.LONG_DEFINITION} /></div></section>}

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><Database size={16} className="mt-0.5 shrink-0 text-slate-400" />All evidence is read from the API response. Missing target codes remain explicitly unresolved.</div>
      </>}
    </div>
  );
}

export default Evidence;
