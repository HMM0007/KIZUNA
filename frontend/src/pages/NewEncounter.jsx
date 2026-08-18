import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Search,
  AlertTriangle,
  Loader2,
  XCircle,
  Database,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { loadTerminology } from "../services/terminologyService";

const patientData = {
  "PT-001": { name: "Meera Joshi", age: 45, gender: "Female", id: "PT-001" },
  "PT-002": { name: "Ramesh Patel", age: 52, gender: "Male", id: "PT-002" },
  "PT-003": { name: "Anita Verma", age: 34, gender: "Female", id: "PT-003" },
  "PT-004": { name: "Suresh Kumar", age: 60, gender: "Male", id: "PT-004" },
};

function MappingStatus({ status }) {
  switch (status) {
    case "DIRECT_CODE_ALIGNMENT":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={14} /> Direct alignment
        </span>
      );
    case "CROSS_CODE_MAPPING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          <ArrowRight size={14} /> Cross-code mapping
        </span>
      );
    case "FOUNDATION_CONCEPT_ONLY":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <AlertTriangle size={14} /> Foundation only
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <XCircle size={14} /> Unmapped
        </span>
      );
  }
}

function EvidenceRow({ label, value, mono = false }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-xs text-slate-700 ${mono ? "font-mono" : ""}`}>
        {value || "Not available"}
      </p>
    </div>
  );
}

function MappingEvidence({ concept }) {
  const hasTarget = Boolean(concept.TM2_CODE || concept.TM2_TERM);
  const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";

  const evidenceMessage = (() => {
    switch (status) {
      case "DIRECT_CODE_ALIGNMENT":
        return "The prototype dataset explicitly identifies this concept as a direct code alignment. KIZUNA displays the stored relationship rather than deriving it from the concept name alone.";
      case "CROSS_CODE_MAPPING":
        return "The prototype dataset explicitly identifies a cross-code relationship between the NAMASTE concept and the ICD-11 TM2 target.";
      case "FOUNDATION_CONCEPT_ONLY":
        return "The source concept is present, but the prototype dataset does not provide a classified ICD-11 TM2 code. KIZUNA does not invent one.";
      default:
        return "No target mapping is recorded in the prototype dataset. KIZUNA keeps the concept unmapped instead of guessing a code.";
    }
  })();

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 size={17} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Mapping evidence</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Traceable evidence behind the terminology relationship shown above.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck size={14} /> Dataset-backed
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <FileCheck2 size={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Evidence basis</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{evidenceMessage}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EvidenceRow label="Source terminology" value="NAMASTE" />
          <EvidenceRow label="Source code" value={concept.NAMASTE_CODE} mono />
          <EvidenceRow label="Source concept" value={concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM} />
          <EvidenceRow label="Target terminology" value={hasTarget ? "ICD-11 TM2" : "No target code"} />
          <EvidenceRow label="Target code" value={concept.TM2_CODE} mono />
          <EvidenceRow label="Target concept" value={concept.TM2_TERM} />
          <EvidenceRow label="Mapping class" value={concept.MAPPING_CLASS || concept.MAPPING_STATUS} mono />
          <EvidenceRow label="Relationship" value={concept.RELATIONSHIP} />
          <EvidenceRow label="Confidence" value={concept.CONFIDENCE ? `${(Number(concept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated"} />
          <EvidenceRow label="Source" value={concept.SOURCE} />
          <EvidenceRow label="Dataset version" value={concept.VERSION} mono />
          <EvidenceRow label="Biomedical reference" value={concept.BIOMEDICAL_CODE || concept.BIOMEDICAL_TERM ? `${concept.BIOMEDICAL_CODE || "Code unavailable"}${concept.BIOMEDICAL_TERM ? ` · ${concept.BIOMEDICAL_TERM}` : ""}` : "Not available"} />
        </div>

        {concept.TM2_URI && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-400">Terminology reference</p>
            <a
              href={concept.TM2_URI}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink size={13} className="shrink-0" />
              {concept.TM2_URI}
            </a>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-800">Prototype integrity rule</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              KIZUNA only presents mapping information contained in the prototype terminology record. Missing target codes remain unmapped or foundation-only; no unsupported ICD-11 code is generated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewEncounter() {
  const { patientId } = useParams();
  const patient = patientData[patientId] || patientData["PT-001"];

  const [concepts, setConcepts] = useState([]);
  const [loadingTerminology, setLoadingTerminology] = useState(true);
  const [terminologyError, setTerminologyError] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingTerminology(true);
        setTerminologyError(null);
        const data = await loadTerminology();
        setConcepts(data);
      } catch (error) {
        console.error("Terminology dataset error:", error);
        setTerminologyError("Unable to load the terminology dataset.");
      } finally {
        setLoadingTerminology(false);
      }
    }
    loadData();
  }, []);

  const suggestions = useMemo(() => {
    const query = diagnosis.trim().toLowerCase();
    if (!query) return [];

    return concepts
      .filter((concept) => {
        const searchableValues = [
          concept.NAMASTE_CODE,
          concept.NAMASTE_TERM,
          concept.NAMASTE_ENGLISH,
          concept.TM2_CODE,
          concept.TM2_TERM,
        ];
        return searchableValues.filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      })
      .slice(0, 12);
  }, [concepts, diagnosis]);

  const selectConcept = (concept) => {
    setSelectedConcept(concept);
    setDiagnosis(concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "");
    setShowSuggestions(false);
    setSaved(false);
  };

  const handleDiagnosisChange = (event) => {
    const value = event.target.value;
    setDiagnosis(value);
    setSelectedConcept(null);
    setSaved(false);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleSave = async () => {
    if (!selectedConcept) return;
    setSaving(true);
    setSaved(false);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
  };

  const formattedConfidence =
    selectedConcept &&
    selectedConcept.CONFIDENCE !== undefined &&
    selectedConcept.CONFIDENCE !== null &&
    selectedConcept.CONFIDENCE !== ""
      ? `${(Number(selectedConcept.CONFIDENCE) * 100).toFixed(0)}%`
      : "Not calculated";

  if (loadingTerminology) {
    return (
      <div className="space-y-6">
        <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Patient
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New Encounter</h1>
          <p className="mt-1 text-sm text-slate-500">Record clinical information and review terminology standardization.</p>
        </div>
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading terminology dataset...</div>
        </div>
      </div>
    );
  }

  if (terminologyError) {
    return (
      <div className="space-y-6">
        <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Patient
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New Encounter</h1>
          <p className="mt-1 text-sm text-slate-500">Record clinical information and review terminology standardization.</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="mt-0.5 text-red-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Terminology dataset unavailable</h2>
              <p className="mt-1 text-sm text-slate-500">{terminologyError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to Patient
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">New Encounter</h1>
        <p className="mt-1 text-sm text-slate-500">Record clinical information and review terminology standardization.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">{patient.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{patient.age} years · {patient.gender} · {patient.id}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} /> 18 Aug 2026</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Clinical information</h2>
          <p className="mt-1 text-xs text-slate-500">Search for a diagnosis or terminology concept. KIZUNA will identify the corresponding terminology mapping.</p>
        </div>
        <div className="space-y-5 p-5">
          <div className="relative">
            <label htmlFor="diagnosis" className="mb-2 block text-sm font-medium text-slate-700">Diagnosis</label>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="diagnosis"
                type="text"
                value={diagnosis}
                onChange={handleDiagnosisChange}
                onFocus={() => diagnosis.trim() && setShowSuggestions(true)}
                placeholder="Search diagnosis, NAMASTE term or code..."
                className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {showSuggestions && !selectedConcept && diagnosis.trim() && (
              <div className="absolute left-0 right-0 top-[70px] z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                {suggestions.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {suggestions.map((concept, index) => {
                      const conceptName = concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "Unnamed concept";
                      const namasteCode = concept.NAMASTE_CODE || "Code unavailable";
                      const tm2Code = concept.TM2_CODE || null;
                      return (
                        <button
                          key={`${namasteCode}-${index}`}
                          type="button"
                          onClick={() => selectConcept(concept)}
                          className="w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                        >
                          <p className="text-sm font-medium text-slate-800">{conceptName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>NAMASTE · {namasteCode}</span>
                            {tm2Code && <><span className="text-slate-300">→</span><span>ICD-11 TM2 · {tm2Code}</span></>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-slate-500">No terminology match found.</p>
                    <p className="mt-1 text-xs text-slate-400">Try a concept name or terminology code.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400"><Database size={13} /><span>Searching prototype terminology dataset · {concepts.length} concepts</span></div>

          <div>
            <label htmlFor="clinical-notes" className="mb-2 block text-sm font-medium text-slate-700">Clinical notes</label>
            <textarea id="clinical-notes" rows="4" placeholder="Enter symptoms, observations, or clinical notes..." className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
          </div>
        </div>
      </section>

      {selectedConcept && (
        <>
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">KIZUNA terminology mapping</h2>
                  <p className="mt-1 text-xs text-slate-500">Suggested terminology relationship for this encounter.</p>
                </div>
                <MappingStatus status={selectedConcept.MAPPING_CLASS || selectedConcept.MAPPING_STATUS} />
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM || "Concept unavailable"}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">NAMASTE · {selectedConcept.NAMASTE_CODE || "Code unavailable"}</p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Mapped to</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400">
                    <ArrowRight size={15} className="hidden lg:block" />
                    <ArrowRight size={15} className="rotate-90 lg:hidden" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.TM2_TERM || "No classified mapping available"}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">ICD-11 TM2 · {selectedConcept.TM2_CODE || "Code not available"}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <div><p className="text-xs text-slate-400">Mapping status</p><div className="mt-2"><MappingStatus status={selectedConcept.MAPPING_CLASS || selectedConcept.MAPPING_STATUS} /></div></div>
                <div><p className="text-xs text-slate-400">Confidence</p><p className="mt-2 text-sm font-medium text-slate-800">{formattedConfidence}</p></div>
                <div><p className="text-xs text-slate-400">Source</p><p className="mt-2 text-sm font-medium text-slate-800">{selectedConcept.SOURCE || "Not available"}</p></div>
              </div>

              {selectedConcept.MAPPING_CLASS === "FOUNDATION_CONCEPT_ONLY" && (
                <div className="mt-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">ICD-11 classification code is not available.</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">The concept exists in the WHO Foundation layer but does not have a classified TM2 code in this prototype dataset. KIZUNA will not invent a code.</p>
                  </div>
                </div>
              )}

              {selectedConcept.MAPPING_CLASS === "UNMAPPED" && (
                <div className="mt-5 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <XCircle size={17} className="mt-0.5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">No ICD-11 mapping identified.</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">This concept should be reviewed manually rather than assigning an unsupported code.</p>
                  </div>
                </div>
              )}

              {selectedConcept.TM2_URI && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">WHO terminology reference</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">{selectedConcept.TM2_URI}</p>
                </div>
              )}
            </div>
          </section>

          <MappingEvidence concept={selectedConcept} />
        </>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link to={`/patients/${patient.id}`} className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
        <button
          type="button"
          disabled={!selectedConcept || saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving encounter..." : saved ? "Encounter saved" : "Save Encounter"}
        </button>
      </div>

      {saved && (
        <div className="flex items-center justify-end gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} /> Encounter saved successfully.</div>
      )}
    </div>
  );
}

export default NewEncounter;
