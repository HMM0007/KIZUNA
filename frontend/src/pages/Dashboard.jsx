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
} from "lucide-react";

import { getAnalyticsSummaryApi, listEncountersApi, listReviewsApi } from "../services/apiService";

const mappingLabels = {
  DIRECT_CODE_ALIGNMENT: "Direct alignment",
  CROSS_CODE_MAPPING: "Cross-code mapping",
  FOUNDATION_CONCEPT_ONLY: "Foundation only",
  UNMAPPED: "Unmapped",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function MappingBadge({ value }) {
  const classes = {
    DIRECT_CODE_ALIGNMENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CROSS_CODE_MAPPING: "border-blue-200 bg-blue-50 text-blue-700",
    FOUNDATION_CONCEPT_ONLY: "border-amber-200 bg-amber-50 text-amber-700",
    UNMAPPED: "border-slate-200 bg-slate-100 text-slate-600",
  };
  const key = value || "UNMAPPED";
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${classes[key] || classes.UNMAPPED}`}>
      {mappingLabels[key] || key.replaceAll("_", " ")}
    </span>
  );
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
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [summary, encounterData, reviewData] = await Promise.all([
        getAnalyticsSummaryApi(),
        listEncountersApi(),
        listReviewsApi(),
      ]);

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading dashboard analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of terminology and clinical activity.</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Analytics unavailable</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <p className="mt-2 text-xs text-slate-400">Start the Team Tenacious Interoperability API on port 8000 and refresh the dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mappingDistribution = analytics?.mapping_distribution || {};
  const reviewDistribution = analytics?.review_distribution || {};
  const recentEncounters = encounters.slice(0, 5);
  const recentReviews = reviews.slice(0, 5);
  const total = analytics?.total_encounters || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <Activity size={11} /> Live API
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Analytics calculated by the Team Tenacious Interoperability API.</p>
        </div>
        <button type="button" onClick={() => loadAnalytics(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total encounters" value={analytics?.total_encounters ?? 0} detail="Persisted clinical records" icon={ClipboardList} />
        <StatCard label="TM2 mapped" value={analytics?.mapped_encounters ?? 0} detail={`${analytics?.mapped_rate ?? 0}% of encounters`} icon={ShieldCheck} />
        <StatCard label="Review required" value={analytics?.review_required ?? 0} detail="Pending human review" icon={AlertTriangle} />
        <StatCard label="Approved" value={reviewDistribution.APPROVED || 0} detail={`${reviewDistribution.REJECTED || 0} rejected · ${reviewDistribution.REVIEW || 0} kept`} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Mapping distribution</h2>
                <p className="mt-1 text-xs text-slate-500">Calculated from persisted encounter classifications.</p>
              </div>
              <Database size={17} className="text-slate-400" />
            </div>
          </div>
          <div className="space-y-5 p-5">
            {Object.entries(mappingLabels).map(([key, label]) => {
              const count = mappingDistribution[key] || 0;
              const percentage = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-400">{count} · {percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {total === 0 && <p className="text-sm text-slate-500">No encounter data yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Review activity</h2>
            <p className="mt-1 text-xs text-slate-500">Latest human-in-the-loop decisions.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentReviews.map((review) => (
              <div key={review.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">{review.diagnosis || "Encounter review"}</p>
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${review.decision === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : review.decision === "REJECTED" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {review.decision}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{review.patient_id} · Encounter #{review.encounter_id} · {formatDate(review.reviewed_at)}</p>
              </div>
            ))}
            {recentReviews.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500">No reviews recorded yet.</div>}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent encounters</h2>
              <p className="mt-1 text-xs text-slate-500">Latest records received from the Team Tenacious Interoperability API.</p>
            </div>
            <span className="text-xs text-slate-400">{total} total</span>
          </div>
        </div>
        {recentEncounters.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ClipboardList size={24} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No encounters yet</p>
            <p className="mt-1 text-xs text-slate-400">Create a patient encounter to populate analytics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50/70"><tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Diagnosis</th><th className="px-5 py-3">Mapping</th><th className="px-5 py-3">Confidence</th><th className="px-5 py-3">Created</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentEncounters.map((encounter) => (
                  <tr key={encounter.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{encounter.patient_id}</p><p className="mt-0.5 text-[11px] text-slate-400">#{encounter.id}</p></td>
                    <td className="px-5 py-4"><p className="max-w-[280px] text-sm text-slate-800">{encounter.diagnosis}</p>{encounter.namaste_code && <p className="mt-1 font-mono text-[11px] text-slate-400">NAMASTE · {encounter.namaste_code}</p>}</td>
                    <td className="px-5 py-4"><MappingBadge value={encounter.mapping_class} /></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{encounter.confidence !== null && encounter.confidence !== undefined ? `${Math.round(Number(encounter.confidence) * 100)}%` : "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(encounter.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
