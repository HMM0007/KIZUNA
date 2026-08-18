import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { getAnalyticsSummaryApi, listEncountersApi, listReviewsApi } from "../services/apiService";

const mappingLabels = {
  DIRECT_CODE_ALIGNMENT: "Direct Code Alignment",
  CROSS_CODE_MAPPING: "Cross-Code Mapping",
  FOUNDATION_CONCEPT_ONLY: "Foundation Concept Only",
  UNMAPPED: "Unmapped",
};

const mappingStyles = {
  DIRECT_CODE_ALIGNMENT: "border-blue-200 bg-blue-50 text-blue-700",
  CROSS_CODE_MAPPING: "border-cyan-200 bg-cyan-50 text-cyan-700",
  FOUNDATION_CONCEPT_ONLY: "border-amber-200 bg-amber-50 text-amber-700",
  UNMAPPED: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/60 text-blue-700",
    green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/60 text-amber-700",
    red: "border-red-100 bg-red-50/60 text-red-700",
  };
  return (
    <div className="border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-slate-900">{value}</p>
          <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center border ${tones[tone]}`}><Icon size={17} /></div>
      </div>
    </div>
  );
}

function MappingBadge({ value }) {
  const key = value || "UNMAPPED";
  return <span className={`inline-flex whitespace-nowrap border px-2 py-1 text-[10px] font-semibold ${mappingStyles[key] || mappingStyles.UNMAPPED}`}>{mappingLabels[key] || key.replaceAll("_", " ")}</span>;
}

function ReviewBadge({ value }) {
  const styles = value === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : value === "REJECTED" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold ${styles}`}>{value || "PENDING"}</span>;
}

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const [summary, encounterData, reviewData] = await Promise.all([getAnalyticsSummaryApi(), listEncountersApi(), listReviewsApi()]);
      setAnalytics(summary);
      setEncounters(encounterData.results || []);
      setReviews(reviewData.results || []);
    } catch (err) {
      console.error("Dashboard analytics error:", err);
      setError(err.message || "Unable to load dashboard analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, []);

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading clinical dashboard...</div></div>;

  if (error) return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Clinical interoperability and terminology activity.</p></div>
      <div className="border border-red-200 bg-white p-6"><div className="flex gap-3"><XCircle className="text-red-500" size={20} /><div><p className="text-sm font-semibold text-slate-900">Analytics unavailable</p><p className="mt-1 text-sm text-slate-500">{error}</p><p className="mt-2 text-xs text-slate-400">Start the Team Tenacious Interoperability API on port 8000 and refresh.</p></div></div></div>
    </div>
  );

  const mappingDistribution = analytics?.mapping_distribution || {};
  const reviewDistribution = analytics?.review_distribution || {};
  const total = analytics?.total_encounters || 0;
  const recentEncounters = encounters.slice(0, 5);
  const pending = reviewDistribution.PENDING || analytics?.review_required || 0;
  const approved = reviewDistribution.APPROVED || 0;
  const rejected = reviewDistribution.REJECTED || 0;
  const reviewedTotal = pending + approved + rejected;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1><span className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"><Activity size={11} /> Live API</span></div>
          <p className="mt-1 text-sm text-slate-500">Overview of clinical interoperability and terminology mapping activity.</p>
        </div>
        <div className="flex items-center gap-3"><span className="hidden text-[11px] text-slate-400 sm:block">Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span><button type="button" onClick={() => loadAnalytics(true)} disabled={refreshing} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh</button></div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Encounters" value={total} detail="All persisted clinical records" icon={ClipboardList} tone="blue" />
        <StatCard label="TM2 Mapped" value={analytics?.mapped_encounters ?? 0} detail={`${analytics?.mapped_rate ?? 0}% of total`} icon={ShieldCheck} tone="green" />
        <StatCard label="Review Queue" value={pending} detail="Requires human review" icon={Clock3} tone="amber" />
        <StatCard label="Approved Mappings" value={approved} detail={`${total ? ((approved / total) * 100).toFixed(1) : 0}% of total`} icon={CheckCircle2} tone="green" />
        <StatCard label="Rejected Mappings" value={rejected} detail={`${total ? ((rejected / total) * 100).toFixed(1) : 0}% of total`} icon={XCircle} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Mapping Status Distribution</h2><p className="mt-1 text-xs text-slate-500">Classification across persisted encounters.</p></div><Database size={17} className="text-slate-400" /></div>
          <div className="divide-y divide-slate-100">
            {Object.entries(mappingLabels).map(([key, label]) => {
              const count = mappingDistribution[key] || 0;
              const percentage = total ? (count / total) * 100 : 0;
              return <div key={key} className="px-5 py-4"><div className="grid grid-cols-[minmax(0,1fr)_50px_64px] items-center gap-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${key === "DIRECT_CODE_ALIGNMENT" ? "bg-blue-600" : key === "CROSS_CODE_MAPPING" ? "bg-cyan-500" : key === "FOUNDATION_CONCEPT_ONLY" ? "bg-amber-500" : "bg-red-500"}`} /><span className="text-sm font-medium text-slate-700">{label}</span></div><span className="text-right text-sm font-semibold text-slate-800">{count}</span><span className="text-right text-xs text-slate-500">{percentage.toFixed(1)}%</span></div><div className="mt-2 h-1.5 bg-slate-100"><div className={`h-full ${key === "DIRECT_CODE_ALIGNMENT" ? "bg-blue-600" : key === "CROSS_CODE_MAPPING" ? "bg-cyan-500" : key === "FOUNDATION_CONCEPT_ONLY" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${percentage}%` }} /></div></div>;
            })}
            <div className="grid grid-cols-[minmax(0,1fr)_50px_64px] gap-3 px-5 py-4 text-sm font-semibold text-slate-800"><span>Total</span><span className="text-right">{total}</span><span className="text-right">100%</span></div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Review Pipeline</h2><p className="mt-1 text-xs text-slate-500">Human review state across mapping decisions.</p></div>
          <div className="p-5">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
              <div className="border border-amber-200 bg-amber-50/50 px-3 py-4 text-center"><p className="text-2xl font-semibold text-slate-900">{pending}</p><p className="mt-1 text-xs font-medium text-amber-700">Pending</p></div><ArrowRight size={17} className="text-slate-300" />
              <div className="border border-emerald-200 bg-emerald-50/50 px-3 py-4 text-center"><p className="text-2xl font-semibold text-slate-900">{approved}</p><p className="mt-1 text-xs font-medium text-emerald-700">Approved</p></div><ArrowRight size={17} className="text-slate-300" />
              <div className="border border-red-200 bg-red-50/50 px-3 py-4 text-center"><p className="text-2xl font-semibold text-slate-900">{rejected}</p><p className="mt-1 text-xs font-medium text-red-700">Rejected</p></div>
            </div>
            <div className="mt-5 border border-slate-200">
              <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><span>Review Status</span><span className="text-right">Count</span><span className="text-right">Percentage</span></div>
              {[['PENDING', pending, 'text-amber-700'], ['APPROVED', approved, 'text-emerald-700'], ['REJECTED', rejected, 'text-red-700']].map(([label, count, tone]) => <div key={label} className="grid grid-cols-3 border-b border-slate-100 px-3 py-2.5 text-xs last:border-0"><span className={`font-medium ${tone}`}>{label}</span><span className="text-right text-slate-700">{count}</span><span className="text-right text-slate-500">{reviewedTotal ? ((count / reviewedTotal) * 100).toFixed(1) : 0}%</span></div>)}
            </div>
          </div>
        </section>
      </div>

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Recent Encounters</h2><p className="mt-1 text-xs text-slate-500">Latest clinical records received by the interoperability API.</p></div><a href="/encounters" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">View all encounters <ArrowRight size={14} /></a></div>
        {recentEncounters.length === 0 ? <div className="px-5 py-12 text-center"><ClipboardList size={24} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No encounters yet</p><p className="mt-1 text-xs text-slate-400">Create an encounter to populate the dashboard.</p></div> : <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="border-b border-slate-200 bg-slate-50"><tr className="text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Encounter</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Diagnosis (NAMASTE)</th><th className="px-5 py-3">NAMASTE Code</th><th className="px-5 py-3">TM2 Code</th><th className="px-5 py-3">Mapping Status</th><th className="px-5 py-3">Review</th></tr></thead><tbody className="divide-y divide-slate-100">{recentEncounters.map((encounter) => <tr key={encounter.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-slate-700">ENC-{String(encounter.id).padStart(6, "0")}</td><td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{formatDate(encounter.created_at)}</td><td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-slate-700">{encounter.patient_id}</td><td className="px-5 py-3.5 text-sm text-slate-800">{encounter.diagnosis}</td><td className="px-5 py-3.5 font-mono text-xs text-slate-500">{encounter.namaste_code || "—"}</td><td className="px-5 py-3.5 font-mono text-xs text-slate-500">{encounter.tm2_code || "—"}</td><td className="px-5 py-3.5"><MappingBadge value={encounter.mapping_class} /></td><td className="px-5 py-3.5"><ReviewBadge value={encounter.review_status || (encounter.mapping_class === "FOUNDATION_CONCEPT_ONLY" || encounter.mapping_class === "UNMAPPED" ? "PENDING" : "APPROVED")} /></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Dashboard;
