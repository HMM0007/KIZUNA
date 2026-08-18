import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { loadTerminology } from "../services/terminologyService";
import { createEncounterApi } from "../services/apiService";

const patientData = {
  "PT-001": { name: "Meera Joshi", age: 45, gender: "Female", id: "PT-001" },
  "PT-002": { name: "Ramesh Patel", age: 52, gender: "Male", id: "PT-002" },
  "PT-003": { name: "Anita Verma", age: 34, gender: "Female", id: "PT-003" },
  "PT-004": { name: "Suresh Kumar", age: 60, gender: "Male", id: "PT-004" },
};

function MappingStatus({ status }) {
  const config = {
    DIRECT_CODE_ALIGNMENT: ["Direct alignment", "border-emerald-200 bg-emerald-50 text-emerald-700"],
    CROSS_CODE_MAPPING: ["Cross-code mapping", "border-blue-200 bg-blue-50 text-blue-700"],
    FOUNDATION_CONCEPT_ONLY: ["Foundation only", "border-amber-200 bg-amber-50 text-amber-700"],
    UNMAPPED: ["Unmapped", "border-slate-200 bg-slate-100 text-slate-600"],
  };
  const [label, classes] = config[status] || config.UNMAPPED;
  return <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${classes}`}>{label}</span>;
}

function EvidenceRow({ label, value, mono = false }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-xs text-slate-700 ${mono ? "font-mono" : ""}`}>{value || "Not available"}</p>
    </div>
  );
}

function MappingEvidence({ concept }) {
  const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";
  const hasTarget = Boolean(concept.TM2_CODE || concept.TM2_TERM);
  const message = status === "DIRECT_CODE_ALIGNMENT"
    ? "The terminology record explicitly identifies a direct code alignment."
    : status === "CROSS_CODE_MAPPING"
      ? "The terminology record explicitly identifies a cross-code relationship between NAMASTE and the ICD-11 TM2 target."
      : status === "FOUNDATION_CONCEPT_ONLY"
        ? "A Foundation concept is available, but no classified ICD-11 TM2 code is recorded."
        : "No target mapping is recorded. The system does not guess an ICD-11 code.";

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><FileCheck2 size={17} className="text-slate-500" /><h2 className="text-sm font-semibold text-slate-900">Mapping evidence</h2></div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"><ShieldCheck size={14} /> Dataset-backed</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Traceable fields stored with this encounter.</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium text-slate-800">Evidence basis</p><p className="mt-1 text-xs leading-5 text-slate-500">{message}</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EvidenceRow label="Source terminology" value="NAMASTE" />
          <EvidenceRow label="Source code" value={concept.NAMASTE_CODE} mono />
          <EvidenceRow label="Source concept" value={concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM} />
          <EvidenceRow label="Target terminology" value={hasTarget ? "ICD-11 TM2" : "No classified target"} />
          <EvidenceRow label="Target code" value={concept.TM2_CODE} mono />
          <EvidenceRow label="Target concept" value={concept.TM2_TERM} />
          <EvidenceRow label="Mapping class" value={concept.MAPPING_CLASS} mono />
          <EvidenceRow label="Mapping status" value={concept.MAPPING_STATUS} mono />
          <EvidenceRow label="Relationship" value={concept.RELATIONSHIP} />
          <EvidenceRow label="Confidence" value={concept.CONFIDENCE ? `${(Number(concept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated"} />
          <EvidenceRow label="Source" value={concept.SOURCE} />
          <EvidenceRow label="Dataset version" value={concept.VERSION} mono />
          <EvidenceRow label="Biomedical code" value={concept.BIOMEDICAL_CODE} mono />
          <EvidenceRow label="Biomedical term" value={concept.BIOMEDICAL_TERM} />
          <EvidenceRow label="Short definition" value={concept.SHORT_DEFINITION} />
        </div>
        {concept.TM2_URI && <div className="border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-400">WHO terminology reference</p><a href={concept.TM2_URI} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-xs text-blue-600"><ExternalLink size={13} />{concept.TM2_URI}</a></div>}
      </div>
    </section>
  );
}

function NewEncounter() {
  const { patientId } = useParams();
  const patient = patientData[patientId] || patientData["PT-001"];
  const [concepts, setConcepts] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadTerminology()
      .then(setConcepts)
      .catch(() => setSaveError("Unable to load the terminology dataset."))
      .finally(() => setLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    const q = diagnosis.trim().toLowerCase();
    if (!q) return [];
    return concepts.filter((concept) => [
      concept.NAMASTE_CODE, concept.NAMASTE_TERM, concept.NAMASTE_ENGLISH,
      concept.TM2_CODE, concept.TM2_TERM, concept.BIOMEDICAL_TERM,
      concept.SHORT_DEFINITION, concept.LONG_DEFINITION,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q))).slice(0, 12);
  }, [concepts, diagnosis]);

  const selectConcept = (concept) => {
    setSelectedConcept(concept);
    setDiagnosis(concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "");
    setShowSuggestions(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedConcept) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const payload = {
        patient_id: patient.id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        namaste_code: selectedConcept.NAMASTE_CODE || "",
        namaste_term: selectedConcept.NAMASTE_TERM || "",
        namaste_english: selectedConcept.NAMASTE_ENGLISH || "",
        tm2_code: selectedConcept.TM2_CODE || "",
        tm2_term: selectedConcept.TM2_TERM || "",
        tm2_uri: selectedConcept.TM2_URI || "",
        mapping_class: selectedConcept.MAPPING_CLASS || "UNMAPPED",
        mapping_status: selectedConcept.MAPPING_STATUS || "UNMAPPED",
        relationship: selectedConcept.RELATIONSHIP || "",
        confidence: selectedConcept.CONFIDENCE === "" || selectedConcept.CONFIDENCE == null ? null : Number(selectedConcept.CONFIDENCE),
        source: selectedConcept.SOURCE || "",
        version: selectedConcept.VERSION || "",
        biomedical_code: selectedConcept.BIOMEDICAL_CODE || "",
        biomedical_term: selectedConcept.BIOMEDICAL_TERM || "",
        short_definition: selectedConcept.SHORT_DEFINITION || "",
        long_definition: selectedConcept.LONG_DEFINITION || "",
        namaste_term_diacritical: selectedConcept.NAMASTE_TERM_DIACRITICAL || "",
        namaste_term_devanagari: selectedConcept.NAMASTE_TERM_DEVANAGARI || "",
      };
      await createEncounterApi(payload);
      setSaved(true);
    } catch (error) {
      console.error("Encounter save error:", error);
      setSaveError(error.message || "Unable to save encounter.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading terminology dataset...</div>;

  return (
    <div className="space-y-6">
      <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} />Back to Patient</Link>
      <div><h1 className="text-xl font-semibold text-slate-900">New Encounter</h1><p className="mt-1 text-sm text-slate-500">Record clinical information and persist the terminology mapping with its evidence.</p></div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</p><h2 className="mt-1 text-base font-semibold text-slate-900">{patient.name}</h2><p className="mt-1 text-sm text-slate-500">{patient.age} years · {patient.gender} · {patient.id}</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} />18 Aug 2026</div></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Clinical information</h2><p className="mt-1 text-xs text-slate-500">Search a diagnosis, NAMASTE term/code, or biomedical term.</p></div>
        <div className="space-y-5 p-5">
          <div className="relative"><label htmlFor="diagnosis" className="mb-2 block text-sm font-medium text-slate-700">Diagnosis</label><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="diagnosis" value={diagnosis} onChange={(e) => { setDiagnosis(e.target.value); setSelectedConcept(null); setSaved(false); setShowSuggestions(Boolean(e.target.value.trim())); }} onFocus={() => diagnosis.trim() && setShowSuggestions(true)} placeholder="Search diagnosis, NAMASTE term or code..." className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></div>
            {showSuggestions && !selectedConcept && diagnosis.trim() && <div className="absolute left-0 right-0 top-[70px] z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">{suggestions.length ? <div className="max-h-80 overflow-y-auto">{suggestions.map((concept, index) => <button key={`${concept.NAMASTE_CODE}-${index}`} type="button" onClick={() => selectConcept(concept)} className="w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><p className="text-sm font-medium text-slate-800">{concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "Unnamed concept"}</p><div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500"><span>NAMASTE · {concept.NAMASTE_CODE || "—"}</span>{concept.TM2_CODE && <span>→ ICD-11 TM2 · {concept.TM2_CODE}</span>}<span>{concept.MAPPING_CLASS || "UNMAPPED"}</span></div></button>)}</div> : <div className="px-4 py-6 text-center text-sm text-slate-500">No terminology match found.</div>}</div>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400"><Database size={13} />{concepts.length} terminology concepts loaded</div>
          <div><label htmlFor="clinical-notes" className="mb-2 block text-sm font-medium text-slate-700">Clinical notes</label><textarea id="clinical-notes" rows="4" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Enter symptoms, observations, or clinical notes..." className="w-full resize-none rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></div>
        </div>
      </section>

      {selectedConcept && <>
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900">Terminology mapping</h2><p className="mt-1 text-xs text-slate-500">Stored mapping state from the prototype terminology record.</p></div><MappingStatus status={selectedConcept.MAPPING_CLASS || "UNMAPPED"} /></div></div>
          <div className="p-5"><div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center"><div className="rounded-lg border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p><p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM || "—"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selectedConcept.NAMASTE_CODE || "Code unavailable"}</p></div><div className="flex justify-center"><ArrowRight size={18} className="text-slate-400" /></div><div className="rounded-lg border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p><p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.TM2_TERM || "No classified mapping available"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selectedConcept.TM2_CODE || "Code not available"}</p></div></div>
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Mapping class</p><div className="mt-2"><MappingStatus status={selectedConcept.MAPPING_CLASS || "UNMAPPED"} /></div></div><div><p className="text-xs text-slate-400">Confidence</p><p className="mt-2 text-sm font-medium text-slate-800">{selectedConcept.CONFIDENCE ? `${(Number(selectedConcept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated"}</p></div><div><p className="text-xs text-slate-400">Relationship</p><p className="mt-2 text-sm font-medium text-slate-800">{selectedConcept.RELATIONSHIP || "Not available"}</p></div></div>
            {selectedConcept.MAPPING_CLASS === "FOUNDATION_CONCEPT_ONLY" && <div className="mt-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4"><AlertTriangle size={17} className="mt-0.5 text-amber-600" /><div><p className="text-sm font-medium text-amber-800">Foundation concept only</p><p className="mt-1 text-xs leading-5 text-amber-700">No classified ICD-11 TM2 code is stored. The API will persist this state without inventing a code.</p></div></div>}
            {selectedConcept.MAPPING_CLASS === "UNMAPPED" && <div className="mt-5 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4"><XCircle size={17} className="mt-0.5 text-slate-500" /><div><p className="text-sm font-medium text-slate-800">No ICD-11 mapping identified</p><p className="mt-1 text-xs text-slate-500">This encounter can be routed to human review.</p></div></div>}
          </div>
        </section>
        <MappingEvidence concept={selectedConcept} />
      </>}

      {saveError && <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle size={17} className="mt-0.5" /><div><p className="font-medium">Unable to save encounter</p><p className="mt-1 text-xs">{saveError}</p></div></div>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to={`/patients/${patient.id}`} className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</Link><button type="button" disabled={!selectedConcept || saving || saved} onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving encounter..." : saved ? "Encounter saved" : "Save Encounter"}</button></div>
      {saved && <div className="flex items-center justify-end gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} />Encounter persisted through the Team Tenacious Interoperability API.</div>}
    </div>
  );
}

export default NewEncounter;
