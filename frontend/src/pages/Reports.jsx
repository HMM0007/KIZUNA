import { useEffect, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { getAnalyticsSummaryApi, listEncountersApi, listReviewsApi } from "../services/apiService";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true); setError("");
      const [analytics, encounters, reviews] = await Promise.all([getAnalyticsSummaryApi(), listEncountersApi(), listReviewsApi()]);
      setReport({ generated_at: new Date().toISOString(), analytics, encounters: encounters.results || [], reviews: reviews.results || [] });
    } catch (err) { setError(err.message || "Unable to generate report."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const download = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `team-tenacious-interoperability-report-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-10 text-sm text-slate-500">Generating interoperability report…</div>;
  if (error) return <div className="border border-red-200 bg-white p-6 text-sm text-red-700">{error}</div>;

  const a = report.analytics;
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div><h1 className="text-2xl font-semibold text-slate-900">Reports</h1><p className="mt-1 text-sm text-slate-500">Current interoperability summary generated from API records.</p></div>
        <div className="flex gap-2"><button onClick={load} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14}/> Refresh</button><button onClick={download} className="inline-flex items-center gap-2 bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Download size={14}/> Export JSON</button></div>
      </div>
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><FileText size={17} className="text-blue-700"/><div><h2 className="text-sm font-semibold text-slate-900">Interoperability Summary</h2><p className="text-xs text-slate-500">Generated {new Date(report.generated_at).toLocaleString("en-IN")}</p></div></div></div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 lg:grid-cols-4">
          {[["Encounters",a.total_encounters],["TM2 mapped",a.mapped_encounters],["Mapping rate",`${a.mapped_rate}%`],["Review required",a.review_required]].map(([label,value]) => <div key={label} className="p-5"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></div>)}
        </div>
      </section>
      <section className="border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Report contents</h2><p className="mt-1 text-xs text-slate-500">The export contains analytics, encounter records and completed review records.</p></div><div className="grid gap-3 p-5 md:grid-cols-3"><div className="border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">{report.encounters.length}</p><p className="mt-1 text-xs text-slate-500">Encounter records</p></div><div className="border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">{report.reviews.length}</p><p className="mt-1 text-xs text-slate-500">Completed reviews</p></div><div className="border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">{Object.values(a.mapping_distribution || {}).reduce((x,y)=>x+y,0)}</p><p className="mt-1 text-xs text-slate-500">Mapped classification records</p></div></div></section>
    </div>
  );
}
