export interface JsonErrorShape {
  message?: string;
}

export interface JsonRequestInit extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function jsonFetch<TResponse>(url: string, init?: JsonRequestInit): Promise<TResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(await safeErrorMessage(res));
  }
  // тип TResponse обязан соответствовать возвращаемым данным
  return (await res.json()) as TResponse;
}

export async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as JsonErrorShape | undefined;
    return data?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}


