import Papa from "papaparse";

const DATA_URL = "/data/namaste_prototype_300_tm2_clean.csv";

export async function loadTerminology() {
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