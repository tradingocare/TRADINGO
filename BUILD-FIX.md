# Build Fix

## Change

**Removed `"incremental": true` from `apps/api/tsconfig.json`.**

### Before

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "rootDir": "./src",
    "incremental": true,       // <-- removed
    "skipLibCheck": true,
    ...
  }
}
```

### After

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "rootDir": "./src",
    "skipLibCheck": true,
    ...
  }
}
```

### Why this fix

`incremental: true` causes `tsc` to write and read `tsconfig.tsbuildinfo`. On every `nest build` with `deleteOutDir: true`:

1. `dist/` is deleted
2. `tsconfig.tsbuildinfo` survives (outside `dist/`)
3. `tsc` reads the stale cache, sees no source changes, emits nothing

Removing `incremental: true` eliminates the stale cache problem entirely. Every `nest build` is a full, clean compile.

### Alternatives considered

| Approach | Verdict |
|----------|---------|
| Remove `incremental: true` | ✅ **Chosen** — simple, correct, no surface area for regressions |
| Prebuild script (`prebuild` npm hook) | ⚠️ Fragile — requires all developers to use the script |
| `tsc --force` flag | ❌ Does not exist in tsc |
| Keep incremental + delete `.tsbuildinfo` in build script | ⚠️ Maintains incremental benefit for `nest start --watch` but adds complexity |

### Impact

- **Build time**: Increases by ~5-10 seconds (full recompile)
- **Correctness**: Guaranteed — every build is deterministic
- **`nest start --watch`**: Still uses `tsc --watch` internally; file watching works fine without `incremental`
