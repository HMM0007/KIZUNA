import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import { API_BASE_URL, resetDemoDataApi } from "./services/apiService";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Patients from "./pages/Patients";
import Encounters from "./pages/Encounters";
import Mapping from "./pages/Mapping";
import Evidence from "./pages/Evidence";
import ReviewQueue from "./pages/ReviewQueue";
import PatientDetails from "./pages/PatientDetails";
import NewEncounterApi from "./pages/NewEncounterApi";

function Settings() {
  const [showConfirm, setShowConfirm] = useState(false); const [resetting, setResetting] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(null);
  const handleReset = async () => { try { setResetting(true); setError(null); setResult(null); const response = await resetDemoDataApi(); setResult(response); setShowConfirm(false); } catch (err) { setError(err.message || "Unable to reset demo data."); } finally { setResetting(false); } };
  return <div className="space-y-5">
    <div><h1 className="text-xl font-semibold text-slate-900">Settings</h1><p className="mt-1 text-sm text-slate-500">Application configuration, API connection and local demo controls.</p></div>
    <section className="border border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-900">Interoperability API</p><p className="mt-1 text-xs text-slate-500">Team Tenacious · v0.1.0</p><div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><span className="status-dot"/> API connection configured</div><p className="mt-2 break-all font-mono text-[11px] text-slate-400">{API_BASE_URL}</p></section>
    <section className="border border-red-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><div className="flex items-start gap-3"><div className="mt-0.5 bg-red-50 p-2 text-red-700"><RotateCcw size={17}/></div><div><h2 className="text-sm font-semibold text-slate-900">Demo data reset</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Clear all locally stored encounters and human-review records before a demonstration. The terminology source and application configuration are not modified.</p></div></div></div><div className="p-5">
      {result && <div className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><div className="flex gap-2"><CheckCircle2 size={17}/><div><p className="font-medium">Demo data reset successfully.</p><p className="mt-1 text-xs">Removed {result.deleted_encounters ?? 0} encounter(s) and {result.deleted_reviews ?? 0} review record(s).</p></div></div></div>}
      {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {!showConfirm ? <button type="button" onClick={() => setShowConfirm(true)} className="inline-flex items-center gap-2 border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"><RotateCcw size={16}/> Reset all demo records</button> : <div className="border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 text-amber-700"/><div><p className="text-sm font-semibold text-amber-900">Confirm reset</p><p className="mt-1 text-xs leading-5 text-amber-800">This permanently removes all locally stored encounter and review records. Terminology data remains unchanged.</p><div className="mt-4 flex gap-2"><button type="button" disabled={resetting} onClick={handleReset} className="inline-flex items-center gap-2 bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">{resetting ? <Loader2 size={15} className="animate-spin"/> : <RotateCcw size={15}/>} Yes, reset records</button><button type="button" disabled={resetting} onClick={() => setShowConfirm(false)} className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Cancel</button></div></div></div></div>}
    </div></section>
  </div>;
}

function App() { return <BrowserRouter><Routes><Route element={<AppLayout />}><Route path="/" element={<Dashboard/>}/><Route path="/analytics" element={<Analytics/>}/><Route path="/reports" element={<Reports/>}/><Route path="/patients" element={<Patients/>}/><Route path="/encounters" element={<Encounters/>}/><Route path="/mapping" element={<Mapping/>}/><Route path="/mapping/evidence" element={<Evidence/>}/><Route path="/reviews" element={<ReviewQueue/>}/><Route path="/settings" element={<Settings/>}/><Route path="/patients/:patientId" element={<PatientDetails/>}/><Route path="/patients/:patientId/encounters/new" element={<NewEncounterApi/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter>; }
export default App;
