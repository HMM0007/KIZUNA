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
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Application settings will appear here.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
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
