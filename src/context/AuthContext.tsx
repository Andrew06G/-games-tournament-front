import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import {
  clearStoredTokens,
  getAccessToken,
  setTokens,
} from "../lib/authStorage";

export type AuthUser = {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string | null;
  estado: string | null;
  globalRoles: string[];
  rolesAsignados: { idTorneo: number | null; nombreRol: string }[];
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, contrasena: string) => Promise<void>;
  register: (payload: {
    nombre: string;
    email: string;
    contrasena: string;
    idRol: number;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      clearStoredTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    function onSessionExpired() {
      setUser(null);
      toast.error("Su sesión expiró. Inicie sesión de nuevo.");
    }
    window.addEventListener("arena:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("arena:session-expired", onSessionExpired);
  }, []);

  const login = useCallback(async (email: string, contrasena: string) => {
    const { data } = await api.post<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, contrasena });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      nombre: string;
      email: string;
      contrasena: string;
      idRol: number;
    }) => {
      const { data } = await api.post<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", payload);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
