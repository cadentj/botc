# AGENTS.md

## Cursor Cloud specific instructions

This is a **SvelteKit** web app ("Blood on the Clocktower" companion) using **pnpm** as the package manager.

### Services

| Service | Command | Notes |
|---|---|---|
| Dev server | `pnpm dev` | Runs Vite dev server on port 5173 |

### Key commands

- **Type check / lint:** `pnpm check` (runs `svelte-kit sync && svelte-check`)
- **Build:** `pnpm build`
- **Dev server:** `pnpm dev` (or `pnpm dev --host 0.0.0.0` to expose externally)

### Caveats

- **esbuild build scripts:** pnpm v10+ blocks build scripts by default. After `pnpm install`, run `pnpm rebuild esbuild` and then `node node_modules/.pnpm/esbuild@*/node_modules/esbuild/install.js` to ensure the native binary is available. Without this, `vite build` and `svelte-check` may fail.
- **Upstash Redis:** The lobby/multiplayer API routes require `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) env vars. Without these, the frontend loads fine but lobby creation/joining returns 500 errors. The app is still fully navigable and developable for frontend work without Redis credentials.
- **No test framework:** The codebase has no automated tests. Validation is done via `pnpm check` (type checking) and manual testing.
- **Adapter:** Uses `@sveltejs/adapter-vercel` for production builds. The dev server works fine locally regardless.
