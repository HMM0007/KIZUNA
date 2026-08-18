import { listTerminologyApi, searchTerminologyApi } from "./apiService";

export async function loadTerminology() {
  const response = await listTerminologyApi(500, 0);
  return response.results || [];
}

export async function searchTerminology(query, limit = 12) {
  if (!query?.trim()) return [];
  const response = await searchTerminologyApi(query.trim(), limit);
  return response.results || [];
}
