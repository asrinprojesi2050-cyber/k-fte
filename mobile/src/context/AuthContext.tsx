import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthResult, CustomerUser, ProviderUser, Role } from "../api/types";
import { registerPushToken } from "../services/push";

const STORAGE_KEY = "kofte.auth";
const PUSH_REGISTER_URL = `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api/push/register`;

interface AuthState {
  token: string;
  role: Role;
  user: CustomerUser | ProviderUser;
}

interface AuthContextValue {
  auth: AuthState | null;
  loading: boolean;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: CustomerUser | ProviderUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setAuth(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(result: AuthResult) {
    const state: AuthState = { token: result.token, role: result.role, user: result.user };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setAuth(state);
    registerPushToken(PUSH_REGISTER_URL, result.token);
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  async function updateUser(user: CustomerUser | ProviderUser) {
    if (!auth) return;
    const updated: AuthState = { ...auth, user };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAuth(updated);
  }

  return <AuthContext.Provider value={{ auth, loading, signIn, signOut, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
