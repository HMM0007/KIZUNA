const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

export function healthCheckApi() {
  return request("/api/health");
}

export function searchTerminologyApi(query, limit = 12) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return request(`/api/terminology/search?${params.toString()}`);
}

export function createEncounterApi(encounter) {
  return request("/api/encounters", {
    method: "POST",
    body: JSON.stringify(encounter),
  });
}

export function listEncountersApi(patientId) {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  return request(`/api/encounters${query}`);
}

export function createReviewApi(review) {
  return request("/api/reviews", {
    method: "POST",
    body: JSON.stringify(review),
  });
}

export function listReviewsApi() {
  return request("/api/reviews");
}

export { API_BASE_URL };
