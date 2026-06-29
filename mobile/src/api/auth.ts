import { apiFetch } from "./client";
import { AuthResult, Category, CustomerUser, ProviderUser, Role } from "./types";

export function requestOtp(phone: string) {
  return apiFetch<{ ok: true; code?: string }>("/api/auth/request-otp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyCustomerOtp(phone: string, code: string, name?: string): Promise<AuthResult> {
  const result = await apiFetch<{ token: string; user: CustomerUser }>("/api/auth/customer/verify-otp", {
    method: "POST",
    body: { phone, code, name },
  });
  return { token: result.token, role: "customer", user: result.user };
}

export async function verifyProviderOtp(
  phone: string,
  code: string,
  details?: { name: string; categoryId: string; city: string }
): Promise<AuthResult> {
  const result = await apiFetch<{ token: string; provider: ProviderUser }>("/api/auth/provider/verify-otp", {
    method: "POST",
    body: { phone, code, ...details },
  });
  return { token: result.token, role: "provider", user: result.provider };
}

export function fetchCategories() {
  return apiFetch<Category[]>("/api/categories");
}

export type { Role };
