import { apiFetch } from "./client";

export interface ReviewInput {
  jobId: string;
  rating: number;
  comment?: string;
}

export function fetchMyJobs(token?: string) {
  return apiFetch<any[]>("/api/jobs/mine", { token });
}

export function completeJob(jobId: string, token?: string) {
  return apiFetch<any>(`/api/jobs/${jobId}/complete`, { method: "POST", token });
}

export function confirmPayment(jobId: string, token?: string) {
  return apiFetch<any>(`/api/jobs/${jobId}/confirm-payment`, { method: "POST", token });
}

export function createReview(data: ReviewInput, token?: string) {
  return apiFetch<any>("/api/reviews", { method: "POST", token, body: data });
}

export function cancelRequest(requestId: string, token?: string) {
  return apiFetch<any>(`/api/requests/${requestId}/cancel`, { method: "POST", token });
}

export function withdrawOffer(offerId: string, token?: string) {
  return apiFetch<any>(`/api/offers/${offerId}/withdraw`, { method: "POST", token });
}

export function updateProviderProfile(data: Record<string, any>, token?: string) {
  return apiFetch<any>("/api/providers/me", { method: "PATCH", token, body: data });
}

export function fetchMyPayments(token?: string) {
  return apiFetch<any>("/api/payments/mine", { token });
}
