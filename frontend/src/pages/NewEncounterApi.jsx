import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Search, AlertTriangle, Loader2, XCircle, FileCheck2, ExternalLink, ShieldCheck, Database } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { searchTerminologyApi, createEncounterApi } from "../services/apiService";

const patientData = {
  "PT-001": { name: "Meera Joshi", age: 45, gender: "Female", id: "PT-001" },
  "PT-002": { name: "Ramesh Patel", age: 52, gender: "Male", id: "PT-002" },
  "PT-003": { name: "Anita Verma", age: 34, gender: "Female", id: "PT-003" },
  "PT-004": { name: "Suresh Kumar", age: 60, gender: "Male", id: "PT-004" },
};

function MappingStatus({ status }) {
  if (status === "DIRECT_CODE_ALIGNMENT") return <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} /> Direct alignment</span>;
  if (status === "CROSS_CODE_MAPPING") return <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"><Database size={14} /> Cross-code mapping</span>;
  if (status === "FOUNDATION_CONCEPT_ONLY") return <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"><AlertTriangle size={14} /> Foundation only</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><XCircle size={14} /> Unmapped</span>;
}

function EvidenceRow({ label, value, mono = false }) {
  return <div className="rounded-md border border-slate-100 bg-slate-50/70 px-3 py-2.5"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 break-words text-xs text-slate-700 ${mono ? "font-mono" : ""}`}>{value || "Not available"}</p></div>;
}

function MappingEvidence({ concept }) {
  const status = concept.MAPPING_CLASS || concept.MAPPING_STATUS || "UNMAPPED";
  const hasTarget = Boolean(concept.TM2_CODE || concept.TM2_TERM);
  const evidence = status === "FOUNDATION_CONCEPT_ONLY"
    ? "The source concept is present, but the prototype dataset does not provide a classified ICD-11 TM2 code. KIZUNA does not invent one."
    : status === "UNMAPPED"
      ? "No target mapping is recorded in the terminology dataset. KIZUNA keeps the concept unmapped instead of guessing a code."
      : "The terminology dataset explicitly records this mapping relationship. KIZUNA displays the stored evidence rather than deriving a code from the concept name alone.";

  return <section className="rounded-lg border border-slate-200 bg-white">
    <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><FileCheck2 size={17} className="text-slate-500" /><h2 className="text-sm font-semibold text-slate-900">Mapping evidence</h2></div><p className="mt-1 text-xs text-slate-500">Traceable evidence returned by the KIZUNA terminology API.</p></div><span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"><ShieldCheck size={14} /> API-backed</span></div></div>
    <div className="space-y-5 p-5">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-medium text-slate-800">Evidence basis</p><p className="mt-1 text-xs leading-5 text-slate-500">{evidence}</p></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <EvidenceRow label="Source terminology" value="NAMASTE" /><EvidenceRow label="Source code" value={concept.NAMASTE_CODE} mono /><EvidenceRow label="Source concept" value={concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM} />
        <EvidenceRow label="Target terminology" value={hasTarget ? "ICD-11 TM2" : "No target code"} /><EvidenceRow label="Target code" value={concept.TM2_CODE} mono /><EvidenceRow label="Target concept" value={concept.TM2_TERM} />
        <EvidenceRow label="Mapping class" value={status} mono /><EvidenceRow label="Relationship" value={concept.RELATIONSHIP} /><EvidenceRow label="Confidence" value={concept.CONFIDENCE ? `${(Number(concept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated"} />
        <EvidenceRow label="Source" value={concept.SOURCE} /><EvidenceRow label="Dataset version" value={concept.VERSION} mono /><EvidenceRow label="Biomedical reference" value={concept.BIOMEDICAL_CODE || concept.BIOMEDICAL_TERM ? `${concept.BIOMEDICAL_CODE || "Code unavailable"}${concept.BIOMEDICAL_TERM ? ` · ${concept.BIOMEDICAL_TERM}` : ""}` : "Not available"} />
      </div>
      {concept.TM2_URI && <div className="border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-400">Terminology reference</p><a href={concept.TM2_URI} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-xs text-blue-600"><ExternalLink size={13} />{concept.TM2_URI}</a></div>}
    </div>
  </section>;
}

export default function NewEncounterApi() {
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
  const confidence = useMemo(() => selectedConcept?.CONFIDENCE ? `${(Number(selectedConcept.CONFIDENCE) * 100).toFixed(0)}%` : "Not calculated", [selectedConcept]);

  useEffect(() => {
    const query = diagnosis.trim();
    if (!query || selectedConcept) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try { setSearching(true); setError(""); const data = await searchTerminologyApi(query, 12); setSuggestions(data.results || []); }
      catch (err) { setError(`Terminology API unavailable: ${err.message}`); setSuggestions([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [diagnosis, selectedConcept]);

  const selectConcept = (concept) => { setSelectedConcept(concept); setDiagnosis(concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM || ""); setShowSuggestions(false); setSavedEncounter(null); };

  const handleSave = async () => {
    if (!selectedConcept) return;
    try {
      setSaving(true); setError("");
      const result = await createEncounterApi({
        patient_id: patient.id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        namaste_code: selectedConcept.NAMASTE_CODE || "",
        namaste_term: selectedConcept.NAMASTE_TERM || "",
        namaste_english: selectedConcept.NAMASTE_ENGLISH || "",
        tm2_code: selectedConcept.TM2_CODE || "",
        tm2_term: selectedConcept.TM2_TERM || "",
        mapping_class: status,
        confidence: selectedConcept.CONFIDENCE ? Number(selectedConcept.CONFIDENCE) : null,
        source: selectedConcept.SOURCE || "",
      });
      setSavedEncounter(result);
    } catch (err) { setError(`Unable to save encounter: ${err.message}`); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <Link to={`/patients/${patient.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to Patient</Link>
    <div><h1 className="text-xl font-semibold text-slate-900">New Encounter</h1><p className="mt-1 text-sm text-slate-500">Record clinical information and persist the terminology decision through the KIZUNA API.</p></div>

    <section className="rounded-lg border border-slate-200 bg-white px-5 py-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</p><h2 className="mt-1 text-base font-semibold text-slate-900">{patient.name}</h2><p className="mt-1 text-sm text-slate-500">{patient.age} years · {patient.gender} · {patient.id}</p></section>

    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Clinical information</h2><p className="mt-1 text-xs text-slate-500">Search the terminology service, review the mapping evidence, then save the encounter.</p></div>
      <div className="space-y-5 p-5">
        <div className="relative"><label htmlFor="diagnosis-api" className="mb-2 block text-sm font-medium text-slate-700">Diagnosis</label><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="diagnosis-api" value={diagnosis} onChange={(e) => { setDiagnosis(e.target.value); setSelectedConcept(null); setSavedEncounter(null); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} placeholder="Search diagnosis, NAMASTE term or code..." className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />{searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}</div>
          {showSuggestions && diagnosis.trim() && !selectedConcept && <div className="absolute left-0 right-0 top-[70px] z-30 max-h-80 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">{suggestions.length ? suggestions.map((concept) => <button key={`${concept.NAMASTE_CODE}-${concept.NAMASTE_TERM}`} type="button" onClick={() => selectConcept(concept)} className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{concept.NAMASTE_ENGLISH || concept.NAMASTE_TERM}</span><MappingStatus status={concept.MAPPING_CLASS || concept.MAPPING_STATUS} /></div><p className="mt-1 text-xs text-slate-500">NAMASTE: {concept.NAMASTE_CODE || "—"}{concept.TM2_CODE ? ` · ICD-11 TM2: ${concept.TM2_CODE}` : " · No classified TM2 code"}</p></button>) : <div className="px-4 py-4 text-sm text-slate-500">No terminology concepts found.</div>}</div>}</div>
        <div><label htmlFor="notes-api" className="mb-2 block text-sm font-medium text-slate-700">Clinical notes</label><textarea id="notes-api" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={4} placeholder="Optional clinical notes..." className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></div>
      </div>
    </section>

    {selectedConcept && <><section className="rounded-lg border border-slate-200 bg-white px-5 py-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected concept</p><h2 className="mt-1 text-base font-semibold text-slate-900">{selectedConcept.NAMASTE_ENGLISH || selectedConcept.NAMASTE_TERM}</h2><p className="mt-1 text-xs text-slate-500">NAMASTE {selectedConcept.NAMASTE_CODE || "—"} · Confidence {confidence}</p></div><MappingStatus status={status} /></div></section><MappingEvidence concept={selectedConcept} /></>}

    {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {savedEncounter && <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3"><CheckCircle2 size={18} className="mt-0.5 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-800">Encounter saved successfully</p><p className="mt-1 text-xs text-emerald-700">Database encounter ID: <span className="font-mono">{savedEncounter.id}</span></p></div></div>}

    <div className="flex items-center justify-end gap-3"><Link to={`/patients/${patient.id}`} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</Link><button type="button" disabled={!selectedConcept || saving} onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving..." : "Save Encounter"}</button></div>
  </div>;
}
