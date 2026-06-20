import { apiFetch } from "./client";

export interface Provider {
  id: string;
  phone: string;
  name: string;
  bio?: string;
  categoryId: string;
  category?: { id: string; nameTr: string; nameEn: string; nameMk: string; nameSq: string };
  city: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  ratingAvg: number;
  completedJobsCount: number;
  verificationStatus: string;
  distanceKm?: number;
}

export async function fetchProviders(params?: { categoryId?: string, lat?: number, lon?: number, limit?: number }): Promise<Provider[]> {
  let qs = "";
  if (params) {
    const parts = [];
    if (params.categoryId) parts.push(`categoryId=${encodeURIComponent(params.categoryId)}`);
    if (params.lat) parts.push(`lat=${params.lat}`);
    if (params.lon) parts.push(`lon=${params.lon}`);
    if (params.limit) parts.push(`limit=${params.limit}`);
    if (parts.length > 0) qs = `?${parts.join("&")}`;
  }
  return apiFetch<Provider[]>(`/api/providers${qs}`);
}

export async function updateProviderProfile(data: any, token?: string) {
  return apiFetch("/api/providers/me", {
    method: "PATCH",
    token,
    body: data,
  });
}
