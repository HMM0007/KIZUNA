import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import { createReviewApi, listEncountersApi, listReviewsApi } from "../services/apiService";

const REVIEWABLE = new Set(["FOUNDATION_CONCEPT_ONLY", "UNMAPPED"]);

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
      <Icon size={14} /> {config.label}
    </span>
  );
}

function DecisionBadge({ decision }) {
  const config = {
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  };
  const label = { APPROVED: "Approved", REJECTED: "Rejected", REVIEW: "Kept for review" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${config[decision] || config.REVIEW}`}>
      <CheckCircle2 size={12} /> {label[decision] || decision}
    </span>
  );
}

function ReviewQueue() {
  const [encounters, setEncounters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [savingDecision, setSavingDecision] = useState(false);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [encounterData, reviewData] = await Promise.all([
        listEncountersApi(),
        listReviewsApi(),
      ]);
      setEncounters(encounterData.results || []);
      setReviews(reviewData.results || []);
    } catch (err) {
      console.error("Review queue API error:", err);
      setError(err.message || "Unable to load the review queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const latestReviews = useMemo(() => {
    const map = new Map();
    reviews.forEach((review) => {
      if (!map.has(review.encounter_id)) map.set(review.encounter_id, review);
    });
    return map;
  }, [reviews]);

  const reviewableEncounters = useMemo(
    () => encounters.filter((encounter) => REVIEWABLE.has(encounter.mapping_class || "UNMAPPED")),
    [encounters]
  );

  const filteredEncounters = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return reviewableEncounters.filter((encounter) => {
      const decision = latestReviews.get(encounter.id);
      const status = encounter.mapping_class || "UNMAPPED";
      if (filter === "PENDING" && decision) return false;
      if (filter === "REVIEWED" && !decision) return false;
      if (filter === "FOUNDATION" && status !== "FOUNDATION_CONCEPT_ONLY") return false;
      if (filter === "UNMAPPED" && status !== "UNMAPPED") return false;
      if (!query) return true;
      return [encounter.id, encounter.patient_id, encounter.diagnosis, encounter.namaste_code, encounter.namaste_english, encounter.tm2_code, encounter.tm2_term]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [reviewableEncounters, latestReviews, searchTerm, filter]);

  const pendingCount = reviewableEncounters.filter((item) => !latestReviews.has(item.id)).length;
  const reviewedCount = reviewableEncounters.length - pendingCount;
  const foundationCount = reviewableEncounters.filter((item) => item.mapping_class === "FOUNDATION_CONCEPT_ONLY").length;
  const unmappedCount = reviewableEncounters.filter((item) => item.mapping_class === "UNMAPPED").length;

  const saveDecision = async (encounter, decision) => {
    try {
      setSavingDecision(true);
      await createReviewApi({
        encounter_id: encounter.id,
        decision,
        reviewer: "Clinical Reviewer",
        notes: decision === "APPROVED"
          ? "Reviewer confirmed the terminology relationship for this encounter."
          : decision === "REJECTED"
            ? "Reviewer rejected the terminology relationship for this encounter."
            : "Reviewer retained this encounter for further terminology review.",
      });
      setSelected(null);
      await loadData(true);
    } catch (err) {
      console.error("Review decision API error:", err);
      setError(err.message || "Unable to save the review decision.");
    } finally {
      setSavingDecision(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading review queue...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Review Queue</h1>
          <p className="mt-1 text-sm text-slate-500">Review encounter mappings that cannot safely be auto-confirmed.</p>
        </div>
        <button type="button" onClick={() => loadData(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"><div className="flex items-start gap-2"><XCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400">Pending review</p><p className="mt-1 text-2xl font-semibold text-slate-900">{pendingCount}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400">Reviewed</p><p className="mt-1 text-2xl font-semibold text-slate-900">{reviewedCount}</p></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700">Foundation only</p><p className="mt-1 text-2xl font-semibold text-amber-900">{foundationCount}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-400">Unmapped</p><p className="mt-1 text-2xl font-semibold text-slate-900">{unmappedCount}</p></div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search encounter, patient, diagnosis or code..." className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></div>
            <div className="flex items-center gap-2"><Filter size={15} className="text-slate-400" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"><option value="PENDING">Pending</option><option value="REVIEWED">Reviewed</option><option value="ALL">All review items</option><option value="FOUNDATION">Foundation only</option><option value="UNMAPPED">Unmapped</option></select></div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEncounters.map((encounter) => {
            const status = encounter.mapping_class || "UNMAPPED";
            const decision = latestReviews.get(encounter.id);
            return <button key={encounter.id} type="button" onClick={() => setSelected(encounter)} className="w-full px-5 py-4 text-left transition hover:bg-slate-50"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-900">{encounter.diagnosis}</p><StatusBadge status={status} />{decision && <DecisionBadge decision={decision.decision} />}</div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span>Encounter #{encounter.id}</span><span>Patient · {encounter.patient_id}</span><span className="font-mono">NAMASTE · {encounter.namaste_code || "—"}</span>{encounter.tm2_code && <span className="font-mono">ICD-11 TM2 · {encounter.tm2_code}</span>}</div></div><span className="text-xs font-medium text-slate-500">Open review →</span></div></button>;
          })}
        </div>

        {filteredEncounters.length === 0 && <div className="px-5 py-12 text-center"><ClipboardCheck size={24} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No review items found</p><p className="mt-1 text-xs text-slate-400">Create a foundation-only or unmapped encounter, or change the filter.</p></div>}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" onClick={() => !savingDecision && setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clinical review</p><h2 className="mt-1 text-base font-semibold text-slate-900">{selected.diagnosis}</h2><p className="mt-1 text-xs text-slate-500">Encounter #{selected.id} · Patient {selected.patient_id}</p></div><button type="button" disabled={savingDecision} onClick={() => setSelected(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Close review">✕</button></div></div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-lg border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p><p className="mt-2 text-sm font-semibold text-slate-900">{selected.namaste_english || selected.namaste_term || "Unavailable"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selected.namaste_code || "Code unavailable"}</p></div><div className="rounded-lg border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p><p className="mt-2 text-sm font-semibold text-slate-900">{selected.tm2_term || "No classified mapping"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selected.tm2_code || "Code unavailable"}</p></div></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Mapping status</p><div className="mt-2"><StatusBadge status={selected.mapping_class} /></div></div><div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Confidence</p><p className="mt-2 text-sm font-medium text-slate-800">{selected.confidence !== null && selected.confidence !== undefined ? `${(Number(selected.confidence) * 100).toFixed(0)}%` : "Not calculated"}</p></div><div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-400">Source</p><p className="mt-2 text-sm font-medium text-slate-800">{selected.source || "Not available"}</p></div></div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><Link2 size={17} className="mt-0.5 shrink-0 text-slate-500" /><div><p className="text-sm font-medium text-slate-800">Reviewer guidance</p><p className="mt-1 text-xs leading-5 text-slate-500">Confirm only when the clinical meaning and terminology relationship are appropriate. Foundation-only concepts may have a source concept without a classified TM2 code. Do not invent a target code.</p></div></div></div>
              {latestReviews.get(selected.id) && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">This encounter has already been reviewed: <strong>{latestReviews.get(selected.id).decision}</strong> by {latestReviews.get(selected.id).reviewer}.</div>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={savingDecision} onClick={() => saveDecision(selected, "REJECTED")} className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={16} /> Reject mapping</button><button type="button" disabled={savingDecision} onClick={() => saveDecision(selected, "REVIEW")} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{savingDecision && <Loader2 size={16} className="animate-spin" />} Keep for review</button><button type="button" disabled={savingDecision} onClick={() => saveDecision(selected, "APPROVED")} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{savingDecision && <Loader2 size={16} className="animate-spin" />} <CheckCircle2 size={16} /> Approve mapping</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewQueue;
