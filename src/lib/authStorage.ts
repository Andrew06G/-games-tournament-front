const ACCESS = "torneo_access_token";
const REFRESH = "torneo_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS, token);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS, accessToken);
  localStorage.setItem(REFRESH, refreshToken);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}
