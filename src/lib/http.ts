export async function readJsonResponse<T>(response: Response | Promise<Response>): Promise<T> {
  const resolvedResponse = await response;
  const text = await resolvedResponse.text();
  let body: unknown = null;

  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Server returned an invalid response (${resolvedResponse.status})`);
    }
  }

  if (!resolvedResponse.ok) {
    const error = typeof body === "object" && body !== null && "error" in body ? String(body.error) : `Request failed (${resolvedResponse.status})`;
    throw new Error(error);
  }

  return body as T;
}
