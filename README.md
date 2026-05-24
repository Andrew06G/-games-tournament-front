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

### Netlify (producción)

1. **Site configuration → Environment variables → Add a variable** (o *Build & deploy → Environment*), para el contexto **Production** (y Preview si quieres):
   - `VITE_API_URL` = `https://games-tournament-back.onrender.com/api` (o la URL de tu API; debe terminar en `/api`).
   - `VITE_SOCKET_URL` = `https://games-tournament-back.onrender.com` (mismo host que el API, sin `/api`).
2. Tras crear o cambiar variables, hace falta **un deploy nuevo** (Vite las incrusta en el JS al compilar).
3. **SPA / React Router:** el archivo `public/_redirects` se copia a `dist/` y Netlify lo usa para devolver `index.html` en rutas como `/torneos` (evita 404 al refrescar).
4. En **Render**, actualiza `FRONTEND_URL` a la URL pública de Netlify (ej. `https://tu-sitio.netlify.app`), **sin barra final** — debe coincidir con el dominio que ves en el navegador. Si sigues la URL de Vercel, CORS fallará. Tras cambiarla, redeploy del backend.

`vercel.json` solo aplica en Vercel; en Netlify no se usa.

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
npm run build         # Compilación para producción
npm run preview       # Vista previa del build
npm run lint          # ESLint
npm run test          # Pruebas unitarias (una ejecución)
npm run test:watch    # Pruebas en modo watch
npm run test:coverage # Cobertura con Vitest + v8
```

## Pruebas unitarias

| Herramienta | Versión (package.json) |
|-------------|-------------------------|
| [Vitest](https://vitest.dev/) | `^3.2.4` |
| [jsdom](https://github.com/jsdom/jsdom) | `^26.1.0` |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | `^16.3.0` |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | `^6.9.1` |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) | `^14.6.1` |

La configuración vive en `vite.config.ts` (bloque `test`) y el setup global en `src/test/setup.ts`. Las variables `VITE_API_URL` y `VITE_SOCKET_URL` se definen en el entorno de prueba para que `src/env.ts` no falle al importarse.

### Qué se prueba

| Área | Archivo de prueba | Contenido |
|------|-------------------|-----------|
| Variables de entorno | `src/env.test.ts` | Lectura, recorte de barras finales y errores si faltan variables |
| Tokens en `localStorage` | `src/lib/authStorage.test.ts` | Guardar, leer y limpiar access/refresh |
| Layout del bracket | `src/lib/bracketLayout.test.ts` | `computeBracketTops`, `bracketCanvasHeight`, constante `BRACKET_ROW_UNIT` |
| Reglas del bracket | `src/lib/bracketHelpers.test.ts` | Equipos en cupos, disponibilidad, registro/validación de resultados, estados del torneo |
| Permisos por rol | `src/lib/torneoPermissions.test.ts` | Organizador, líder de equipo y registro ampliado de marcadores |
| Ruta protegida | `src/components/ProtectedRoute.test.tsx` | Carga, redirección a login y acceso autenticado |
| Tarjeta de torneo | `src/components/torneo/TorneoCard.test.tsx` | Badges, enlaces, cupo, barra de progreso e iniciales del juego |

Utilidades de prueba compartidas: `src/test/testUtils.tsx` (`renderWithProviders` con `MemoryRouter` y `QueryClient`).

### Ejecutar las pruebas

Tras `npm install`:

```bash
npm run test
```

Modo interactivo (re-ejecuta al guardar):

```bash
npm run test:watch
```

Informe de cobertura en consola y carpeta `coverage/`:

```bash
npm run test:coverage
```

Ejecutar un solo archivo:

```bash
npx vitest run src/lib/bracketHelpers.test.ts
```

### Pruebas en Docker (`DockerFilePruebas`)

Imagen de CI que instala dependencias (`npm ci` si el lock está al día; si no, `npm install` según `package.json`), ejecuta `npm run build` y luego `npm run test:coverage`. Si algo falla, el `docker build` termina con error.

Antes del primer build, conviene ejecutar `npm install` en el host y commitear `package-lock.json` para builds reproducibles con `npm ci` puro.

```bash
docker build -f DockerFilePruebas -t torneo-front-pruebas .
```

Copiar el informe HTML de cobertura al host tras un build exitoso:

```bash
docker create --name torneo-front-coverage torneo-front-pruebas
docker cp torneo-front-coverage:/app/coverage ./coverage
docker rm torneo-front-coverage
```

Requisitos: Docker instalado y acceso a red en el build (descarga de la imagen base `node:22-bookworm-slim` y de paquetes npm).

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
- `**/*.test.ts(x)`** — pruebas unitarias junto al código que cubren (ver sección anterior).

Pendiente según `PROMPT_CURSOR.md`: más páginas (inscripción, gestión, notificaciones), `BracketVisualizer`, hooks de socket.

## Documentación del monorepo

- `PROMPT_CURSOR.md` — contexto, endpoints y plan de implementación.
- `schema_torneos(1).sql` — modelo de datos de referencia.
