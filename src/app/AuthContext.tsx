import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from "../shared/api/client";
import * as authApi from "../features/auth/api";
import type { AuthUser } from "../features/auth/types";

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Context = createContext<AuthState | null>(null);

/** Owns JWT + user identity for the console session. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      setReady(true);
      return;
    }
    let cancelled = false;
    authApi
      .getMe()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredAuthToken();
        }
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    setStoredAuthToken(result.access_token);
    setUser(result.user);
  };

  const signUp = async (username: string, password: string) => {
    await authApi.signUp(username, password);
    await login(username, password);
  };

  const logout = () => {
    clearStoredAuthToken();
    setUser(null);
  };

  return (
    <Context.Provider value={{ user, ready, login, signUp, logout }}>
      {children}
    </Context.Provider>
  );
}

/** Session helpers for signed-in identity. */
export function useAuth(): AuthState {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
