import { resolveApiUrl } from "@/lib/api-url";

export async function uploadVehicleImages(files: File[], token: string | null): Promise<string[]> {
  if (!files.length) return [];
  const url = resolveApiUrl("/api/vehicles/upload-images");
  const formData = new FormData();
  for (const f of files) {
    formData.append("images", f);
  }
  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; urls?: string[] };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Upload failed (${res.status})`);
  }
  return data.urls ?? [];
}
