// lib/streamClient.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function streamPost(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // same as apiClient's withCredentials
    signal,
    body: JSON.stringify(body),
  });

  // Mirror apiClient's 401 handling — trigger a refresh then retry once
  if (response.status === 401) {
    const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
      credentials: "include",
    });
    if (!refreshed.ok) {
      window.location.href = "/login";
      return;
    }
    // Retry original request with the new cookie
    return streamPost(url, body, onDelta, signal);
  }

  if (response.status === 204) {
    throw new Error("API returned 204 No Content for stream request");
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.type === "delta") onDelta(parsed.text);
        if (parsed.type === "error") throw new Error(parsed.message);
      } catch {}
    }
  }
}
