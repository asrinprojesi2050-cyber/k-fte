export type Role = "customer" | "provider";

export interface Category {
  id: string;
  slug: string;
  nameTr: string;
  nameMk: string;
  nameSq: string;
}

export interface CustomerUser {
  id: string;
  phone: string;
  name: string;
  photoUrl?: string;
}

export interface ProviderUser {
  id: string;
  phone: string;
  name: string;
  bio?: string;
  categoryId: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  ratingAvg: number;
  completedJobsCount: number;
}

export interface AuthResult {
  token: string;
  role: Role;
  user: CustomerUser | ProviderUser;
}
