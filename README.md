# Torneo Videojuegos — Frontend

Interfaz web del **sistema de gestión de torneos de videojuegos**: listado de torneos, brackets públicos, registro e inicio de sesión, paneles por rol (organizador / jugador), notificaciones y actualización en tiempo real del bracket.

Stack: **React**, **TypeScript**, **Vite**, **React Router**, **TanStack Query**, **Tailwind CSS**, **Axios**, **Socket.io-client**.

## Requisitos

| Herramienta | Versión recomendada      |
|-------------|--------------------------|
| Node.js     | **20 LTS** o **22**      |
| npm         | Incluido con Node        |

```bash
node -v
npm -v
```

## Configuración

1. Entrar en esta carpeta (`Torneo Videojuegos Front`).
2. Crear `.env` según el ejemplo del equipo (URL del API y, si aplica, WebSocket).

Ejemplo (ver también `.env.example`):

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

- **`VITE_API_URL`:** debe incluir el prefijo `/api` (coincide con cómo está montado Express en el backend). Sin barra final; el cliente la normaliza igualmente.
- Si falta alguna variable, la app **falla al arrancar** con un mensaje claro (`src/env.ts`) para evitar pantallas rotas por `.env` olvidado.

El backend debe tener `FRONTEND_URL=http://localhost:5173` para **CORS** y Socket.io.

## Rutas de la SPA (implementación actual)

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública (prototipo ArenaManager en React) |
| `/torneos` | Listado de torneos (diseño `tournaments.html`, shell ArenaManager) |
| `/login`, `/register` | Sesión (pantalla completa, diseño `login.html` / `register.html`) |
| `/torneos/:id/bracket` | Bracket y partidas (diseño ArenaManager) |
| `/torneos/:id/equipos` | Inscripción y tabla de equipos |
| `/torneos/:id/registrar-resultado` | Registrar marcador (jugador) |
| `/torneos/:id/validar-resultados` | Validar marcadores pendientes (organizador) |
| `/notificaciones` | Centro de alertas, preferencias y programación de enfrentamientos |
| `/dashboard` | Panel (requiere sesión) |
| `/torneos/crear` | Crear torneo (requiere sesión y rol global **organizador**) |

**Prisma y seed** viven en `Torneo Videojuegos Back`. Desde esta carpeta puede ejecutarse igualmente `npm run prisma:seed` (y `prisma:generate`, `prisma:migrate`, `prisma:studio`), que delegan al backend.

**Cliente HTTP:** `src/lib/api.ts` (Axios) añade el Bearer automáticamente, guarda tokens en `localStorage` y reintenta **una vez** con `/auth/refresh` ante un `401`.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Vite mostrará la URL local (por defecto **http://localhost:5173/**).

Otros comandos:

```bash
npm run build    # Compilación para producción
npm run preview  # Vista previa del build
npm run lint     # ESLint
```

## Relación con el backend y Prisma

- El API vive en el proyecto **Torneo Videojuegos Back** (puerto típico **3000**).
- La base de datos se gestiona con **Prisma** en el backend; comandos útiles allí:

  ```bash
  cd "../Torneo Videojuegos Back"
  npx prisma generate
  npx prisma migrate dev
  npm run prisma:seed
  npx prisma studio
  ```

## Estructura del código (`src/`)

- `env.ts` — validación de variables Vite.
- `lib/api.ts`, `lib/authStorage.ts` — Axios + tokens.
- `context/AuthContext.tsx` — sesión global.
- `components/layout/AppLayout.tsx`, `components/ProtectedRoute.tsx`, `components/torneo/TorneoCard.tsx`
- `pages/` — pantallas principales (Home, Login, Register, Dashboard, CrearTorneo, TorneoBracket).

Pendiente según `PROMPT_CURSOR.md`: más páginas (inscripción, gestión, notificaciones), `BracketVisualizer`, hooks de socket.

## Documentación del monorepo

- `PROMPT_CURSOR.md` — contexto, endpoints y plan de implementación.
- `schema_torneos(1).sql` — modelo de datos de referencia.
