import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Search,
  AlertTriangle,
  Loader2,
  XCircle,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Database,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { searchTerminologyApi, createEncounterApi } from "../services/apiService";

const patientData = {
  "PT-001": { name: "Meera Joshi", age: 45, gender: "Female", id: "PT-001" },
  "PT-002": { name: "Ramesh Patel", age: 52, gender: "Male", id: "PT-002" },
  "PT-003": { name: "Anita Verma", age: 34, gender: "Female", id: "PT-003" },
  "PT-004": { name: "Suresh Kumar", age: 60, gender: "Male", id: "PT-004" },
};

const DEMO_SEARCHES = ["osteoarthritis", "tremor", "contracture", "pelvic pain"];

function MappingStatus({ status }) {
  const config = {
    DIRECT_CODE_ALIGNMENT: ["Direct alignment", "border-emerald-200 bg-emerald-50 text-emerald-700", CheckCircle2],
    CROSS_CODE_MAPPING: ["Cross-code mapping", "border-blue-200 bg-blue-50 text-blue-700", Sparkles],
    FOUNDATION_CONCEPT_ONLY: ["Foundation only", "border-amber-200 bg-amber-50 text-amber-700", AlertTriangle],
    UNMAPPED: ["Unmapped", "border-slate-200 bg-slate-100 text-slate-600", XCircle],
  };
  const [label, classes, Icon] = config[status] || config.UNMAPPED;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}><Icon size={13} />{label}</span>;
}

function EvidenceRow({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-xs text-slate-700 ${mono ? "font-mono" : ""}`}>{value || "Not available"}</p>
    </div>
  );
}

function MappingEvidence({ concept }) {
  const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";
  const hasTarget = Boolean(concept.TM2_CODE || concept.TM2_TERM);
  const confidence = concept.CONFIDENCE !== "" && concept.CONFIDENCE != null ? `${(Number(concept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated";
  const message = status === "DIRECT_CODE_ALIGNMENT"
    ? "The terminology record explicitly identifies a direct code alignment."
    : status === "CROSS_CODE_MAPPING"
      ? "The terminology record explicitly identifies a cross-code relationship between NAMASTE and the ICD-11 TM2 target."
      : status === "FOUNDATION_CONCEPT_ONLY"
        ? "A Foundation concept is available, but no classified ICD-11 TM2 code is recorded."
        : "No target mapping is recorded. The API does not guess an ICD-11 code.";

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2"><FileCheck2 size={17} className="text-slate-500" /><h2 className="text-sm font-semibold text-slate-900">Mapping evidence</h2></div>
          <p className="mt-1 text-xs text-slate-500">Traceable terminology data returned by the interoperability API.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-flex"><ShieldCheck size={13} /> API-backed</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-slate-800">Evidence basis</p><MappingStatus status={status} /></div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{message}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EvidenceRow label="Source terminology" value="NAMASTE" />
          <EvidenceRow label="Source code" value={concept.NAMASTE_CODE} mono />
          <EvidenceRow label="Source concept" value={concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM} />
          <EvidenceRow label="Target terminology" value={hasTarget ? "ICD-11 TM2" : "No classified target"} />
          <EvidenceRow label="Target code" value={concept.TM2_CODE} mono />
          <EvidenceRow label="Target concept" value={concept.TM2_TERM} />
          <EvidenceRow label="Mapping class" value={status} mono />
          <EvidenceRow label="Mapping status" value={concept.MAPPING_STATUS} mono />
          <EvidenceRow label="Relationship" value={concept.RELATIONSHIP} />
          <EvidenceRow label="Confidence" value={confidence} />
          <EvidenceRow label="Source" value={concept.SOURCE} />
          <EvidenceRow label="Dataset version" value={concept.VERSION} mono />
          <EvidenceRow label="Biomedical code" value={concept.BIOMEDICAL_CODE} mono />
          <EvidenceRow label="Biomedical term" value={concept.BIOMEDICAL_TERM} />
          <EvidenceRow label="Short definition" value={concept.SHORT_DEFINITION} />
        </div>
        {concept.TM2_URI && <div className="border-t border-slate-100 pt-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">WHO terminology reference</p><a href={concept.TM2_URI} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-xs text-blue-600 hover:text-blue-700"><ExternalLink size={13} />{concept.TM2_URI}</a></div>}
      </div>
    </section>
  );
}

export default function NewEncounter() {
  const { patientId } = useParams();
  const patient = patientData[patientId] || patientData["PT-001"];
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedEncounter, setSavedEncounter] = useState(null);
  const [error, setError] = useState("");

  const status = selectedConcept?.MAPPING_CLASS || selectedConcept?.MAPPING_STATUS || "UNMAPPED";
  const confidence = useMemo(() => selectedConcept?.CONFIDENCE !== "" && selectedConcept?.CONFIDENCE != null ? `${(Number(selectedConcept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated", [selectedConcept]);

  useEffect(() => {
    const query = diagnosis.trim();
    if (!query || selectedConcept) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        setError("");
        const data = await searchTerminologyApi(query, 12);
        setSuggestions(data.results || []);
      } catch (err) {
        setError(`Terminology API unavailable: ${err.message}`);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [diagnosis, selectedConcept]);

  const selectConcept = (concept) => {
    setSelectedConcept(concept);
    setDiagnosis(concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "");
    setShowSuggestions(false);
    setSavedEncounter(null);
    setError("");
  };

  const runDemoSearch = (term) => {
    setSelectedConcept(null);
    setSavedEncounter(null);
    setError("");
    setDiagnosis(term);
    setShowSuggestions(true);
  };

  const clearSelection = () => {
    setDiagnosis("");
    setClinicalNotes("");
    setSelectedConcept(null);
    setSuggestions([]);
    setSavedEncounter(null);
    setError("");
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!selectedConcept) return;
    try {
      setSaving(true);
      setError("");
      const result = await createEncounterApi({
        patient_id: patient.id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        namaste_code: selectedConcept.NAMASTE_CODE || "",
        namaste_term: selectedConcept.NAMASTE_TERM || "",
        namaste_english: selectedConcept.NAMASTE_ENGLISH || "",
        namaste_term_diacritical: selectedConcept.NAMASTE_TERM_DIACRITICAL || "",
        namaste_term_devanagari: selectedConcept.NAMASTE_TERM_DEVANAGARI || "",
        tm2_code: selectedConcept.TM2_CODE || "",
        tm2_term: selectedConcept.TM2_TERM || "",
        tm2_uri: selectedConcept.TM2_URI || "",
        mapping_class: status,
        mapping_status: selectedConcept.MAPPING_STATUS || status,
        relationship: selectedConcept.RELATIONSHIP || "",
        confidence: selectedConcept.CONFIDENCE === "" || selectedConcept.CONFIDENCE == null ? null : Number(selectedConcept.CONFIDENCE),
        source: selectedConcept.SOURCE || "",
        version: selectedConcept.VERSION || "",
        biomedical_code: selectedConcept.BIOMEDICAL_CODE || "",
        biomedical_term: selectedConcept.BIOMEDICAL_TERM || "",
        short_definition: selectedConcept.SHORT_DEFINITION || "",
        long_definition: selectedConcept.LONG_DEFINITION || "",
      });
      setSavedEncounter(result);
    } catch (err) {
      setError(`Unable to save encounter: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} />Back to Patient</Link>
        <span className="hidden items-center gap-2 text-xs text-slate-400 sm:inline-flex"><ShieldCheck size={14} />API-connected workflow</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">New Encounter</h1>
        <p className="mt-1 text-sm text-slate-500">Capture clinical notes, resolve terminology, review evidence, and save the mapping through the interoperability API.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Patient</p><h2 className="mt-1 text-base font-semibold text-slate-900">{patient.name}</h2><p className="mt-1 text-sm text-slate-500">{patient.age} years · {patient.gender} · <span className="font-mono text-xs">{patient.id}</span></p></div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Encounter workflow</p><p className="mt-1 text-xs text-slate-600">Terminology → Evidence → Save → Review</p></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Clinical information</h2><p className="mt-1 text-xs text-slate-500">Search by diagnosis, NAMASTE code, terminology term, or biomedical term.</p></div>
        <div className="space-y-5 p-5">
          <div className="relative">
            <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="diagnosis-api" className="text-sm font-medium text-slate-700">Diagnosis / terminology concept</label>{selectedConcept && <button type="button" onClick={clearSelection} className="text-xs font-medium text-slate-500 hover:text-slate-900">Clear selection</button>}</div>
            <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="diagnosis-api" value={diagnosis} onChange={(e) => { setDiagnosis(e.target.value); setSelectedConcept(null); setSavedEncounter(null); setError(""); setShowSuggestions(true); }} onFocus={() => diagnosis.trim() && setShowSuggestions(true)} placeholder="e.g. tremor, contracture, SK52..." className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />{searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}</div>
            {showSuggestions && diagnosis.trim() && !selectedConcept && <div className="absolute left-5 right-5 top-[88px] z-30 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">{suggestions.length ? suggestions.map((concept, index) => <button key={`${concept.NAMASTE_CODE || "concept"}-${index}`} type="button" onClick={() => selectConcept(concept)} className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium text-slate-800">{concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || "Unnamed concept"}</span><MappingStatus status={concept.MAPPING_CLASS || concept.MAPPING_STATUS} /></div><p className="mt-1 text-xs text-slate-500">NAMASTE: {concept.NAMASTE_CODE || "—"}{concept.TM2_CODE ? ` · ICD-11 TM2: ${concept.TM2_CODE}` : " · No classified TM2 code"}</p></button>) : <div className="px-4 py-5 text-center text-sm text-slate-500">No terminology concepts found for this search.</div>}</div>}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-slate-500"><Database size={14} />Terminology lookup is served by the interoperability API.</div><span className="text-[11px] text-slate-400">Live search · 250ms debounce</span></div>

          <div><label htmlFor="clinical-notes" className="mb-2 block text-sm font-medium text-slate-700">Clinical notes <span className="font-normal text-slate-400">(optional)</span></label><textarea id="clinical-notes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={4} placeholder="Enter symptoms, observations, examination findings, or other clinical notes..." className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100" /></div>

          <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demo concepts</p><div className="flex flex-wrap gap-2">{DEMO_SEARCHES.map((term) => <button key={term} type="button" onClick={() => runDemoSearch(term)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">{term}</button>)}</div></div>
        </div>
      </section>

      {selectedConcept && <>
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Selected concept</p><h2 className="mt-1 text-base font-semibold text-slate-900">{selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM || "Unnamed concept"}</h2><p className="mt-1 text-xs text-slate-500">NAMASTE <span className="font-mono">{selectedConcept.NAMASTE_CODE || "—"}</span> · Confidence {confidence}</p></div><MappingStatus status={status} /></div></div>
          <div className="p-5"><div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch"><div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">NAMASTE</p><p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM || "—"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selectedConcept.NAMASTE_CODE || "Code unavailable"}</p></div><div className="flex items-center justify-center"><div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400"><ArrowRight size={16} /></div></div><div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ICD-11 TM2</p><p className="mt-3 text-sm font-semibold text-slate-900">{selectedConcept.TM2_TERM || "No classified mapping available"}</p><p className="mt-1 font-mono text-xs text-slate-500">{selectedConcept.TM2_CODE || "Code not available"}</p></div></div></div>
        </section>
        <MappingEvidence concept={selectedConcept} />
      </>}

      {status === "FOUNDATION_CONCEPT_ONLY" && selectedConcept && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><div className="flex gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Human review will be required</p><p className="mt-1 text-xs leading-5">A Foundation concept is available, but there is no classified TM2 code in the dataset.</p></div></div></div>}
      {status === "UNMAPPED" && selectedConcept && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><div className="flex gap-3"><XCircle size={18} className="mt-0.5 shrink-0 text-slate-500" /><div><p className="font-semibold">No target mapping is recorded</p><p className="mt-1 text-xs leading-5 text-slate-500">The encounter can still be saved, and the case can enter the human-review workflow.</p></div></div></div>}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {savedEncounter && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="flex items-start gap-3"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-800">Encounter saved successfully</p><p className="mt-1 text-xs text-emerald-700">Database encounter ID: <span className="font-mono">{savedEncounter.id}</span>. The stored mapping evidence is now available to the review and analytics workflow.</p></div></div></div>}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400">Only API-returned terminology mappings are persisted.</p><div className="flex items-center justify-end gap-3"><Link to={`/patients/${patient.id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</Link><button type="button" disabled={!selectedConcept || saving} onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving..." : "Save Encounter"}</button></div></div>
    </div>
  );
}
