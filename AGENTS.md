# AGENTS.md

## Commands
- **Dev**: `npm run tauri dev`
- **Build**: `npm run tauri build`
- **Type check**: `npx tsc --noEmit`
- **Rust check**: `cd src-tauri && cargo check`

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite 7
- **Backend**: Tauri 2 (Rust 2021) with reqwest, scraper, tokio

## Code Style

### TypeScript
- Named exports for components/hooks: `export function ComponentName()`
- Types in `src/types.ts`, import with `type` keyword: `import type { X } from "../types"`
- Props interfaces inline above component: `interface XProps { ... }`
- Custom hooks in `src/hooks/` with `use` prefix
- Use `useState`, `useCallback` from React; `invoke` from `@tauri-apps/api/core`

### Rust
- Modules in separate files, re-export in `lib.rs`
- Tauri commands: `#[tauri::command] async fn name() -> Result<T, String>`
- Use `map_err(|e| e.to_string())` for error conversion
- Structs derive: `#[derive(Debug, Serialize, Deserialize, Clone)]`
