import { useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { getAnalyticsSummaryApi } from "../services/apiService";

const labels = {
  DIRECT_CODE_ALIGNMENT: "Direct Code Alignment",
  CROSS_CODE_MAPPING: "Cross-Code Mapping",
  FOUNDATION_CONCEPT_ONLY: "Foundation Concept Only",
  UNMAPPED: "Unmapped",
};

const tones = {
  DIRECT_CODE_ALIGNMENT: "bg-blue-600",
  CROSS_CODE_MAPPING: "bg-cyan-500",
  FOUNDATION_CONCEPT_ONLY: "bg-amber-500",
  UNMAPPED: "bg-red-500",
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      setData(await getAnalyticsSummaryApi());
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-10 text-sm text-slate-500">Loading interoperability analytics…</div>;
  if (error) return <div className="border border-red-200 bg-white p-6 text-sm text-red-700">{error}</div>;

  const total = data?.total_encounters || 0;
  const mapping = data?.mapping_distribution || {};
  const reviews = data?.review_distribution || {};
  const pending = reviews.PENDING || data?.review_required || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div><h1 className="text-2xl font-semibold text-slate-900">Analytics</h1><p className="mt-1 text-sm text-slate-500">Detailed interoperability and mapping performance.</p></div>
        <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total encounters", total, "All persisted clinical records", Activity],
          ["TM2 mapped", data?.mapped_encounters || 0, `${data?.mapped_rate || 0}% mapping rate`, CheckCircle2],
          ["Pending review", pending, "Requires human validation", Clock3],
          ["Approved", reviews.APPROVED || 0, "Latest approved decisions", CheckCircle2],
        ].map(([title, value, detail, Icon]) => <div key={title} className="border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><Icon size={18} className="text-slate-400"/></div></div>)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Mapping performance</h2><p className="mt-1 text-xs text-slate-500">Distribution of mapping classifications.</p></div>
          <div className="p-5 space-y-5">
            {Object.entries(labels).map(([key, label]) => { const count = mapping[key] || 0; const pct = total ? (count / total) * 100 : 0; return <div key={key}><div className="flex justify-between text-xs"><span className="font-medium text-slate-700">{label}</span><span className="text-slate-500">{count} · {pct.toFixed(1)}%</span></div><div className="mt-2 h-2 bg-slate-100"><div className={`h-full ${tones[key]}`} style={{ width: `${pct}%` }}/></div></div>; })}
          </div>
        </section>
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Review outcomes</h2><p className="mt-1 text-xs text-slate-500">Latest review decision for each reviewed encounter.</p></div>
          <div className="divide-y divide-slate-100">
            {[["Pending", pending, "text-amber-700"],["Approved", reviews.APPROVED || 0, "text-emerald-700"],["Rejected", reviews.REJECTED || 0, "text-red-700"],["Review / kept", reviews.REVIEW || 0, "text-blue-700"]].map(([name,count,tone]) => <div key={name} className="flex items-center justify-between px-5 py-4"><span className={`text-sm font-medium ${tone}`}>{name}</span><span className="text-sm font-semibold text-slate-800">{count}</span></div>)}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500"><BarChart3 size={14} className="mr-2 inline"/>Analytics are calculated from persisted API records.</div>
        </section>
      </div>
    </div>
  );
}
