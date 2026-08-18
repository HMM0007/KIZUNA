import {
  ArrowLeft,
  CalendarDays,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const patientData = {
  "PT-001": {
    name: "Meera Joshi",
    age: 45,
    gender: "Female",
    id: "PT-001",
  },

  "PT-002": {
    name: "Ramesh Patel",
    age: 52,
    gender: "Male",
    id: "PT-002",
  },

  "PT-003": {
    name: "Anita Verma",
    age: 34,
    gender: "Female",
    id: "PT-003",
  },

  "PT-004": {
    name: "Suresh Kumar",
    age: 60,
    gender: "Male",
    id: "PT-004",
  },
};

const encounters = [
  {
    id: "ENC-001",
    date: "18 Aug 2026",
    diagnosis: "Vataja Prameha",
    status: "Mapped",
  },
  {
    id: "ENC-002",
    date: "12 Aug 2026",
    diagnosis: "Amlapitta",
    status: "Review",
  },
];

function PatientDetails() {
  const { patientId } = useParams();

  const patient =
    patientData[patientId] || patientData["PT-001"];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Patients
      </Link>

      {/* Patient header */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {patient.name
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {patient.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {patient.age} years · {patient.gender} ·{" "}
                {patient.id}
              </p>
            </div>
          </div>

          <Link
            to={`/patients/${patient.id}/encounters/new`}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            New Encounter
          </Link>
        </div>
      </section>

      {/* Encounters */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Encounters
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Previous clinical encounters and terminology activity.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {encounters.map((encounter) => (
            <div
              key={encounter.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400">
                  <CalendarDays size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {encounter.diagnosis}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {encounter.date} · {encounter.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                    encounter.status === "Mapped"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {encounter.status}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  View
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PatientDetails;