# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based code playground for React applications with real-time bundling via esbuild-wasm. Users can write, bundle, and preview React code entirely in the browser with support for npm packages, multiple templates (Plain React, Material UI), and a virtual file system.

## Development Commands

```bash
# Start development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

## Architecture

### State Management (Zustand)

All application state is managed through a single Zustand store in `src/store/fileSystemStore.ts`:

- **Files**: Hierarchical file structure stored as nested `Record<string, FileNode>`
- **Active file**: Currently opened file path
- **Expanded folders**: Set of folder paths that are expanded in the tree
- **Packages**: Virtual package.json managed through store actions
- **Templates**: Current template type (plain-react, mui)

**Important**: The store uses optimized shallow cloning for performance. Only the path being modified is cloned, not the entire tree. Helper functions `getNodeAtPath` and `setNodeAtPath` handle path traversal and mutations.

### Bundling System

The bundler (`src/utils/bundler.ts`) is the heart of the application:

1. **ESBuild-WASM**: Browser-based bundling with WebAssembly
2. **Virtual File System Plugin**: Resolves imports from the in-memory file tree
3. **CSS Handling**: Extracts and injects only imported CSS files
4. **Import Maps**: Dynamically generates ESM import maps for external packages via esm.sh CDN
5. **Hot Module Reload**: Smart HMR with dependency graph tracking to determine full reload vs. smooth update

**Bundle Caching**: Results are cached using a fast file hash (path + length + first/last 100 chars). Cache is invalidated when files change.

**Dependency Graph Tracking**: The bundler builds a dependency graph on each bundle to detect:
- Files added/deleted
- Import statements changed
- When these change, `requiresFullReload: true` is set to force iframe recreation

### Resolver Strategy (src/utils/resolvers/)

The app automatically selects the appropriate CDN resolver based on installed packages:

- **Base Resolver** (`baseResolver.ts`): Standard packages use `https://esm.sh/package@version`
- **MUI Resolver** (`muiResolver.ts`): When Material UI or Emotion is detected, adds `?external=react,react-dom` to prevent multiple React instances

**Resolver Factory** (`resolvers/index.ts`): `getResolver(packageVersions)` returns the appropriate resolver function.

### Preview Component Architecture

The Preview component (`src/components/Preview.tsx`) implements **double buffering** for flicker-free updates:

1. **Two iframe slots**: `slot1` and `slot2` alternate as active/inactive
2. **Smart reload detection**: Uses bundle metadata (`requiresFullReload`) to decide:
   - Full reload: Swap iframe slots (for structural changes)
   - HMR: Post message to existing iframe with new code (for content-only changes)
3. **Console interception**: Iframe code is injected with a console interceptor that posts messages to parent

**HMR Flow**:
- Bundler detects content-only change → sends `hot-module-reload` message to iframe
- Iframe receives message → updates CSS → executes new module code → React re-renders
- No page reload, no network requests, no flicker

### File System Operations

The virtual file system supports:

- **CRUD operations**: Create, rename, delete files and folders
- **Path-based access**: All operations use forward-slash paths like `src/components/App.jsx`
- **Inline editing**: File tree supports inline rename and creation
- **Package management**: Packages are stored in virtual `package.json`

**Important paths**:
- Entry point: `src/index.jsx` or `src/index.js`
- Package manifest: `package.json` (root level)

### Template System

Templates are defined in `src/utils/templates/`:

- **vanillaTemplate.ts**: Plain HTML, CSS, and JavaScript - no frameworks
- **defaultTemplate.ts**: Plain React with gradient UI
- **muiTemplate.ts**: Material UI with comprehensive examples
- **Template switching**: Replaces entire file tree and resets state

Each template exports a `Template` object with:
- `id`: Unique identifier (vanilla, react, or mui)
- `name`: Display name
- `description`: User-facing description
- `icon`: Emoji identifier for UI display
- `files`: Complete file tree structure
- `packages`: Pre-installed package versions

### Monaco Editor Integration

The code editor (`src/components/CodeEditor.tsx`) uses Monaco Editor (VS Code's editor):

- **Language detection**: Automatic based on file extension
- **Theme support**: Monaco themes via `monaco-themes` package
- **Auto-save**: Content changes trigger immediate store updates
- **Type declarations**: Custom type declaration in `src/monaco-themes.d.ts` for theme imports

## Key Implementation Details

### CSS Import Resolution

CSS files are only included if they're explicitly imported in JS/JSX files. The bundler:
1. Scans all JS/JSX files for `import './file.css'` statements
2. Resolves relative paths (handles `./`, `../`, and bare imports)
3. Collects matching CSS content
4. Injects combined CSS into a single `<style id="app-styles">` tag

**HMR CSS updates**: The HMR listener updates the same `#app-styles` tag to maintain style continuity.

### Console Interception

The bundler injects a console interceptor script that:
- Wraps `console.log`, `console.error`, `console.warn`, `console.info`
- Posts messages to parent via `window.postMessage`
- Catches global errors and unhandled promise rejections
- Preserves original console behavior for debugging

### Emotion/MUI Support

Material UI v5+ requires special handling:
- Uses Emotion for CSS-in-JS
- Needs `jsxImportSource: "@emotion/react"` in esbuild config
- Requires polyfills for `global` and `process.env`
- Must use external React/ReactDOM to avoid instance conflicts

**Detection**: The bundler checks for `@mui` or `@emotion` in package names to enable MUI mode.

### Package Installation Flow

1. User searches npm registry via `src/utils/npmApi.ts`
2. User selects package and version
3. `PackageManager` component calls `addPackage` or `addPackages` store action
4. Store updates virtual `package.json`
5. Next bundle detects new packages and generates import map
6. External packages are loaded from esm.sh CDN

**Peer dependencies**: The `dependencyResolver.ts` automatically detects and installs peer dependencies.

## Working with This Codebase

### Adding a New Template

1. Update `src/utils/templates/types.ts` to add your template type to `TemplateType`
2. Create a new file in `src/utils/templates/` (e.g., `vueTemplate.ts`)
3. Define file structure, packages, and metadata (name, description, icon)
4. Export the template with a unique `id` matching the type
5. Add to `src/utils/templates/index.ts` imports and exports
6. The template will automatically appear in `TemplateModal.tsx`

### Modifying Bundle Behavior

- **Entry point detection**: Modify the `entryFile` finder in `bundler.ts` (currently looks for `src/index.js` or `src/index.jsx`)
- **External package handling**: Adjust the `externalPackages` extraction logic
- **CSS processing**: Modify `cssImportRegex` and path resolution logic
- **Loader selection**: Update `getLoader` function for new file types

### Adding a Resolver

1. Create new resolver in `src/utils/resolvers/` (e.g., `viteResolver.ts`)
2. Implement resolver function matching `ResolverResult` type
3. Add detection logic to `getResolver` factory in `resolvers/index.ts`
4. Ensure it generates correct CDN URLs for your target packages

### Testing Bundler Changes

- Check browser console for `[Bundler]` and `[Iframe]` logs
- Verify HMR updates show correct revision numbers
- Test with and without dependency changes to verify smart reload
- Check that CSS updates without full page reload
- Verify console messages are captured and displayed

## Common Gotchas

- **File paths**: Always use forward slashes, never backslashes
- **Path resolution**: The bundler resolves relative imports from the file's directory, not root
- **React version conflicts**: When adding React-based packages, ensure the MUI resolver is triggered if needed
- **Cache invalidation**: The bundle cache uses a simple hash that may miss certain edge cases
- **Template switching**: Clears all state including active file - handle edge cases in UI
- **Zustand updates**: Store updates are synchronous except for `loadTemplate` which uses `setTimeout` for editor refresh timing
