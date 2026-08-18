import Papa from "papaparse";

import { searchTerminologyApi } from "./apiService";

const DATA_URL = "/data/namaste_prototype_300_tm2_clean.csv";

async function loadTerminologyFromCsv() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error("Unable to load terminology dataset.");
  }

  const csvText = await response.text();
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}

export async function loadTerminology() {
  try {
    const response = await searchTerminologyApi("a", 50);
    if (response.results?.length) {
      // The backend search endpoint is intentionally lightweight. For the
      // prototype, keep the full CSV as the authoritative local catalogue.
      return loadTerminologyFromCsv();
    }
  } catch (error) {
    console.warn("KIZUNA API unavailable; using local terminology fallback.", error);
  }

  return loadTerminologyFromCsv();
}

export { loadTerminologyFromCsv };
