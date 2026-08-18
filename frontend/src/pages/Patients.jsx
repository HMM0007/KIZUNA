import { Search, ChevronRight, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

const patients = [
  {
    id: "PT-001",
    name: "Meera Joshi",
    age: 45,
    gender: "Female",
    lastEncounter: "Today",
    status: "Active",
  },
  {
    id: "PT-002",
    name: "Ramesh Patel",
    age: 52,
    gender: "Male",
    lastEncounter: "Today",
    status: "Active",
  },
  {
    id: "PT-003",
    name: "Anita Verma",
    age: 34,
    gender: "Female",
    lastEncounter: "Yesterday",
    status: "Active",
  },
  {
    id: "PT-004",
    name: "Suresh Kumar",
    age: 60,
    gender: "Male",
    lastEncounter: "Yesterday",
    status: "Active",
  },
];

function Patients() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      [
        patient.id,
        patient.name,
        patient.gender,
        patient.status,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View patients and their clinical encounters.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <UserPlus size={16} />
          New Patient
        </button>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search patients..."
            className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      {/* Patient table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Patient Records
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredPatients.length} patients
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">
                  Patient
                </th>

                <th className="px-5 py-3 font-medium">
                  Age / Gender
                </th>

                <th className="px-5 py-3 font-medium">
                  Last Encounter
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {patient.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {patient.id}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {patient.age} / {patient.gender}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {patient.lastEncounter}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {patient.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <a
                      href={`/patients/${patient.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      View
                      <ChevronRight size={15} />
                    </a>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Patients;