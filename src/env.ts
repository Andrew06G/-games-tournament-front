/**
 * Falla en arranque si falta configuración (evita pantallas en blanco por URL mal copiada).
 * Normaliza: sin barra final en la URL base del API.
 */
function readRequired(name: "VITE_API_URL" | "VITE_SOCKET_URL"): string {
  const raw = import.meta.env[name];
  if (raw === undefined || String(raw).trim() === "") {
    throw new Error(
      `[${name}] no está definida. Copie .env.example a .env y revise el README del frontend.`,
    );
  }
  return String(raw).trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  return readRequired("VITE_API_URL");
}

export function getSocketUrl(): string {
  return readRequired("VITE_SOCKET_URL");
}
