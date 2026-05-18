import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { getApiBaseUrl } from "../env";
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "./authStorage";

const baseURL = getApiBaseUrl();

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryConfig | undefined;
    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    const rel = String(original.url ?? "");
    if (
      rel.includes("/auth/login") ||
      rel.includes("/auth/register") ||
      rel.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refresh = getRefreshToken();
    if (!refresh) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${baseURL}/auth/refresh`,
        { refreshToken: refresh },
        { headers: { "Content-Type": "application/json" } },
      );
      setAccessToken(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      clearStoredTokens();
      window.dispatchEvent(new CustomEvent("arena:session-expired"));
      return Promise.reject(error);
    }
  },
);
