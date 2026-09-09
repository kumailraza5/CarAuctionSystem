import { resolveApiUrl } from "@/lib/api-url";

export type ListingThread = {
  buyerId: number;
  buyerName: string;
};

export type ListingMessage = {
  id: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchListingThreads(vehicleId: number, token: string | null): Promise<ListingThread[]> {
  const res = await fetch(resolveApiUrl(`/api/vehicles/${vehicleId}/threads`), {
    headers: { ...authHeaders(token) },
  });
  if (res.status === 403 || res.status === 401) return [];
  if (!res.ok) throw new Error(`Failed to load threads (${res.status})`);
  return (await res.json()) as ListingThread[];
}

export async function fetchListingMessages(vehicleId: number, token: string | null, buyerId?: number): Promise<ListingMessage[]> {
  const url = buyerId 
     ? resolveApiUrl(`/api/vehicles/${vehicleId}/messages?buyerId=${buyerId}`)
     : resolveApiUrl(`/api/vehicles/${vehicleId}/messages`);
  const res = await fetch(url, {
    headers: { ...authHeaders(token) },
  });
  if (res.status === 403 || res.status === 401) return [];
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
  return (await res.json()) as ListingMessage[];
}

export async function postListingMessage(vehicleId: number, token: string | null, body: string, buyerId?: number): Promise<ListingMessage> {
  const res = await fetch(resolveApiUrl(`/api/vehicles/${vehicleId}/messages`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(buyerId ? { body, buyerId } : { body }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<ListingMessage>;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Send failed (${res.status})`);
  }
  return data as ListingMessage;
}
