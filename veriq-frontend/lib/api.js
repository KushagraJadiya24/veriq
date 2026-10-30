export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Small fetch wrapper: adds the bearer token, encodes JSON or form bodies,
// and turns every failure into an ApiError with a readable message.
export async function api(path, { token, method = "GET", json, form } = {}) {
  const headers = {};
  let body;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(
      `Can't reach the API at ${API_BASE}. Check that the backend is running.`,
      0
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    let message = "Request failed.";
    if (typeof data?.detail === "string") message = data.detail;
    else if (res.status === 422) message = "That input isn't valid.";
    else if (res.status >= 500)
      message = "The server hit an unexpected error. Check the backend logs.";
    throw new ApiError(message, res.status);
  }
  return data;
}
