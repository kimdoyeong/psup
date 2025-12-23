# Contributing to PSUP

## Release Process

### Creating a Release

1. **Update version** in `package.json` and `src-tauri/tauri.conf.json`:
   ```bash
   # e.g., from 0.1.0 to 0.2.0
   npm version minor
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   git push origin --tags
   ```

3. **GitHub Actions will automatically**:
   - Build for Windows (x86_64)
   - Build for macOS (Intel & Apple Silicon)
   - Create GitHub Release with binaries

### Manual Build (for testing)

```bash
# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS (Intel)
npm run tauri build -- --target x86_64-apple-darwin

# macOS (Apple Silicon)
npm run tauri build -- --target aarch64-apple-darwin
```

## Development Workflow

### Prerequisites
- Node.js 20+
- Rust 1.70+
- Tauri CLI

### Setup
```bash
npm install
npm run tauri dev
```

### Type Checking
```bash
npx tsc --noEmit
cargo check
```

### Code Style
- TypeScript: Follow existing patterns, use named exports
- Rust: Use `cargo fmt` and `cargo clippy`

## CI/CD

Two workflows run automatically:

1. **CI** (`ci.yml`): On push/PR to main/develop
   - Type checking
   - Rust checks
   - Build verification

2. **Build & Release** (`build-release.yml`): On version tags (v*)
   - Multi-platform builds
   - Automatic GitHub Release creation
