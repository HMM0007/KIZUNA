import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Encounters from "./pages/Encounters";
import Mapping from "./pages/Mapping";
import Evidence from "./pages/Evidence";
import ReviewQueue from "./pages/ReviewQueue";
import PatientDetails from "./pages/PatientDetails";
import NewEncounterApi from "./pages/NewEncounterApi";

function Settings() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Application configuration and API connection settings.</p>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Interoperability API</p>
        <p className="mt-1 text-xs text-slate-500">Team Tenacious · v0.1.0</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><span className="status-dot" /> API connection configured</div>
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
