import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import { resetDemoDataApi } from "./services/apiService";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Encounters from "./pages/Encounters";
import Mapping from "./pages/Mapping";
import Evidence from "./pages/Evidence";
import ReviewQueue from "./pages/ReviewQueue";
import PatientDetails from "./pages/PatientDetails";
import NewEncounterApi from "./pages/NewEncounterApi";

function Settings() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    try {
      setResetting(true);
      setError(null);
      setResult(null);
      const response = await resetDemoDataApi();
      setResult(response);
      setShowConfirm(false);
    } catch (err) {
      setError(err.message || "Unable to reset demo data.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Application configuration and API connection settings.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Interoperability API</p>
        <p className="mt-1 text-xs text-slate-500">Team Tenacious · v0.1.0</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><span className="status-dot" /> API connection configured</div>
      </section>

      <section className="rounded-lg border border-red-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-red-50 p-2 text-red-700"><RotateCcw size={17} /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Demo data reset</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Clear all locally stored encounters and human-review records before a demonstration. The terminology source dataset and application configuration are not modified.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {result && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><div><p className="font-medium">Demo data reset successfully.</p><p className="mt-1 text-xs">Removed {result.deleted_encounters} encounter(s) and {result.deleted_reviews} review record(s).</p></div></div>
            </div>
          )}
          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          {!showConfirm ? (
            <button type="button" onClick={() => setShowConfirm(true)} className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
              <RotateCcw size={16} /> Reset all demo records
            </button>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Confirm reset</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">This permanently removes all locally stored encounter and review records from the prototype database. Terminology data will remain unchanged.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={resetting} onClick={handleReset} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
                      {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Yes, reset records
                    </button>
                    <button type="button" disabled={resetting} onClick={() => setShowConfirm(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Reports() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Clinical interoperability summaries and mapping review outputs.</p>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-900">Report workspace</p>
        <p className="mt-1 text-sm text-slate-500">Use the Dashboard analytics and Review Queue for the current prototype. Exportable reports can be added without changing the underlying API model.</p>
      </section>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/encounters" element={<Encounters />} />
          <Route path="/mapping" element={<Mapping />} />
          <Route path="/mapping/evidence" element={<Evidence />} />
          <Route path="/reviews" element={<ReviewQueue />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/patients/:patientId" element={<PatientDetails />} />
          <Route path="/patients/:patientId/encounters/new" element={<NewEncounterApi />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
