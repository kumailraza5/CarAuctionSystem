import type { Vehicle } from "@workspace/api-client-react";
import { resolveApiUrl } from "@/lib/api-url";

export async function fetchMyPurchases(token: string | null): Promise<Vehicle[]> {
  if (!token) return [];
  const res = await fetch(resolveApiUrl("/api/vehicles/purchases/mine"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to load purchases (${res.status})`);
  const data = (await res.json()) as { vehicles?: Vehicle[] };
  return data.vehicles ?? [];
}
