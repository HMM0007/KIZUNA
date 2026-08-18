import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, Clock3, RefreshCw, ShieldCheck, Sparkles, TrendingUp, XCircle } from "lucide-react";
import { getAnalyticsSummaryApi, listEncountersApi, listReviewsApi } from "../services/apiService";

const mappingMeta = {
  DIRECT_CODE_ALIGNMENT: { label: "Direct Alignment", dot: "bg-blue-600", text: "text-blue-700", bg: "bg-blue-50" },
  CROSS_CODE_MAPPING: { label: "Cross-Code", dot: "bg-cyan-500", text: "text-cyan-700", bg: "bg-cyan-50" },
  FOUNDATION_CONCEPT_ONLY: { label: "Foundation Only", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  UNMAPPED: { label: "Unmapped", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

function Kpi({ title, value, caption, icon: Icon, accent }) {
  return <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
    <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
    <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500"><Icon size={17}/></div></div>
  </div>;
}

function Analytics() {
  const [data, setData] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (refresh = false) => { try { refresh ? setRefreshing(true) : setLoading(true); setError(""); const [summary, encounterData, reviewData] = await Promise.all([getAnalyticsSummaryApi(), listEncountersApi(), listReviewsApi()]); setData(summary); setEncounters(encounterData.results || []); setReviews(reviewData.results || []); } catch (err) { setError(err.message || "Unable to load analytics."); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { load(); }, []);

  const total = data?.total_encounters || 0;
  const mapped = data?.mapped_encounters || 0;
  const mapping = data?.mapping_distribution || {};
  const reviewsByState = data?.review_distribution || {};
  const pending = reviewsByState.PENDING || data?.review_required || 0;
  const approved = reviewsByState.APPROVED || 0;
  const rejected = reviewsByState.REJECTED || 0;
  const reviewed = pending + approved + rejected;
  const completion = reviewed ? Math.round(((approved + rejected) / reviewed) * 100) : 0;
  const recent = useMemo(() => encounters.slice(0, 7), [encounters]);

  if (loading) return <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500"><RefreshCw size={17} className="mr-2 animate-spin"/>Loading clinical intelligence...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-white p-6"><p className="font-semibold text-slate-900">Analytics unavailable</p><p className="mt-1 text-sm text-slate-500">{error}</p><button onClick={() => load()} className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Try again</button></div>;

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white"><BarChart3 size={16}/></span><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Analytics</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><Activity size={10}/> Live</span></div><p className="mt-2 text-sm text-slate-500">Interoperability performance, mapping quality and clinical review activity.</p></div>
      <div className="flex items-center gap-3"><span className="text-[11px] text-slate-400">{total} encounter records</span><button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/> Refresh</button></div>
    </header>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi title="Total encounters" value={total} caption="Persisted clinical records" icon={Activity} accent="bg-slate-900"/>
      <Kpi title="TM2 mapped" value={`${data?.mapped_rate ?? 0}%`} caption={`${mapped} records mapped to TM2`} icon={ShieldCheck} accent="bg-emerald-500"/>
      <Kpi title="Pending review" value={pending} caption="Requires human validation" icon={Clock3} accent="bg-amber-500"/>
      <Kpi title="Review completion" value={`${completion}%`} caption={`${approved + rejected} completed decisions`} icon={TrendingUp} accent="bg-blue-600"/>
    </section>

    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold text-slate-950">Mapping intelligence</h2><p className="mt-1 text-xs text-slate-500">Distribution of terminology outcomes across all encounters.</p></div><Sparkles size={17} className="text-slate-300"/></div>
        <div className="mt-6 space-y-5">{Object.entries(mappingMeta).map(([key, meta]) => { const count = mapping[key] || 0; const pct = total ? (count / total) * 100 : 0; return <div key={key}><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${meta.dot}`}/><span className="text-sm font-medium text-slate-700">{meta.label}</span></div><span className="text-xs font-semibold text-slate-700">{count} <span className="font-normal text-slate-400">· {pct.toFixed(1)}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${meta.dot} transition-all duration-500`} style={{width:`${pct}%`}}/></div></div>; })}</div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mapped coverage</p><p className="mt-1 text-xl font-semibold text-slate-950">{mapped}/{total}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coverage rate</p><p className="mt-1 text-xl font-semibold text-slate-950">{data?.mapped_rate ?? 0}%</p></div></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div><h2 className="text-sm font-semibold text-slate-950">Review health</h2><p className="mt-1 text-xs text-slate-500">Current decision pipeline.</p></div>
        <div className="mx-auto mt-7 flex h-40 w-40 items-center justify-center rounded-full" style={{background:`conic-gradient(#10b981 ${reviewed ? (approved/reviewed)*100 : 0}%, #ef4444 ${reviewed ? (approved/reviewed)*100 : 0}% ${reviewed ? ((approved+rejected)/reviewed)*100 : 0}%, #f59e0b ${reviewed ? ((approved+rejected)/reviewed)*100 : 0}% 100%)`}}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-semibold text-slate-950">{completion}%</span><span className="text-[10px] uppercase tracking-wider text-slate-400">complete</span></div></div>
        <div className="mt-7 space-y-3">{[["Pending",pending,"bg-amber-500"],["Approved",approved,"bg-emerald-500"],["Rejected",rejected,"bg-red-500"]].map(([label,count,dot])=><div key={label} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><span className={`h-2 w-2 rounded-full ${dot}`}/>{label}</span><span className="font-semibold text-slate-800">{count}</span></div>)}</div>
      </div>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-950">Recent interoperability activity</h2><p className="mt-1 text-xs text-slate-500">Latest records contributing to the analytics view.</p></div><div className="inline-flex items-center gap-2 self-start rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> API data</div></div>
      {recent.length === 0 ? <div className="px-6 py-14 text-center"><BarChart3 size={25} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-700">No activity yet</p><p className="mt-1 text-xs text-slate-400">Create an encounter to populate analytics.</p></div> : <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50/80"><tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><th className="px-6 py-3">Encounter</th><th className="px-6 py-3">Diagnosis</th><th className="px-6 py-3">NAMASTE</th><th className="px-6 py-3">TM2</th><th className="px-6 py-3">Classification</th></tr></thead><tbody className="divide-y divide-slate-100">{recent.map(e => { const meta = mappingMeta[e.mapping_class] || mappingMeta.UNMAPPED; return <tr key={e.id} className="transition-colors hover:bg-slate-50/70"><td className="whitespace-nowrap px-6 py-4"><span className="text-xs font-semibold text-slate-700">ENC-{String(e.id).padStart(6,"0")}</span><span className="ml-2 text-[10px] text-slate-400">{e.patient_id}</span></td><td className="px-6 py-4 text-sm font-medium text-slate-800">{e.diagnosis}</td><td className="px-6 py-4 font-mono text-xs text-slate-500">{e.namaste_code || "—"}</td><td className="px-6 py-4 font-mono text-xs text-slate-500">{e.tm2_code || "—"}</td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.bg} ${meta.text}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}/>{meta.label}</span></td></tr>})}</tbody></table></div>}
    </section>
  </div>;
}

export default Analytics;
