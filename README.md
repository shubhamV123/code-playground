# Code Playground

A full-featured browser-based code playground for React applications, built with React, TypeScript, and modern web technologies. Write, bundle, and preview React code entirely in your browser!

## ✨ Features

### 🎨 Template System

- **Multiple Project Templates**:
  - Plain React - Lightweight React starter with modern gradient UI
  - Material UI - Full MUI setup with comprehensive component examples
- **One-Click Switching**: Switch between templates with confirmation dialog
- **Template Persistence**: Active template and files saved in state

### 📁 Advanced File System

- **Hierarchical File Tree**: Nested folders and files with expand/collapse
- **Inline Operations**: Hover over any folder to show action buttons:
  - Create new files and folders at any level
  - Rename files and folders inline
  - Delete files and folders with confirmation
- **Smart Icons**: File type detection with colored icons (.js, .jsx, .ts, .tsx, .html, .css, .json)
- **Visual Feedback**: Active file highlighting and hover states

### 💻 Modern Code Editor

- **CodeMirror 6 Integration**: Lightning-fast, extensible code editor
- **Language Support**: JavaScript, JSX, TypeScript, TSX, HTML, CSS, JSON
- **Auto-save**: Changes automatically saved to state
- **Dark Theme**: OneDark color scheme optimized for long coding sessions

### 🚀 Live Preview

- **Real-time Bundling**: ESBuild-powered bundling in the browser
- **React Rendering**: Full React 18 support with JSX transformation
- **Iframe Isolation**: Sandboxed preview with clean error handling
- **Auto-refresh**: Smooth transitions when code changes
- **Console Integration**: Captured console.log, error, warn, and info messages

### 📦 Package Management

- **NPM Package Search**: Search and install packages from npm registry
- **Smart Dependency Resolution**: Automatic peer dependency detection
- **Version Selection**: Choose specific package versions
- **Visual Dependencies Panel**: See installed packages with versions
- **One-Click Install/Uninstall**: Easy package management

### 🎯 Advanced Bundling

- **Dual Resolver System**:
  - Base Resolver: Standard React packages
  - MUI Resolver: Material UI with external React handling
- **Import Map Generation**: Dynamic ESM import maps via esm.sh
- **Peer Dependency Handling**: Automatic resolution of peer dependencies
- **Virtual File System**: In-memory file resolution for imports

### 🎛️ Flexible Layout

- **Resizable Panels**: Four-panel layout with drag-to-resize:
  - File tree (vertical split with dependencies)
  - Dependencies panel (resizable height)
  - Code editor
  - Live preview with console
- **Responsive Design**: Clean, VS Code-inspired dark UI
- **Collapsible Sections**: Toggle dependencies and console visibility

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### State Management

- **Zustand** - Lightweight state management for file system and packages

### Code Editor

- **CodeMirror 6** - Extensible code editor
- **@codemirror/lang-javascript** - JavaScript/JSX syntax
- **@codemirror/theme-one-dark** - Dark theme

### Bundling & Execution

- **esbuild-wasm** - WebAssembly-based bundler
- **esm.sh** - CDN for ES modules with import maps
- **Virtual FS Plugin** - In-memory file resolution

### UI Components

- **react-resizable-panels** - Draggable panel layout
- **react-icons** - VS Code and file type icons
- **Material UI** (optional) - Template with full MUI setup

### Package Management

- **NPM Registry API** - Package search and metadata
- **Custom Dependency Resolver** - Smart peer dependency detection

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at `http://localhost:5173`

## 📂 Project Structure

```
code-playground/
├── src/
│   ├── components/
│   │   ├── FileTree.tsx          # File tree with hover actions
│   │   ├── FileToolbar.tsx       # Top toolbar with file operations
│   │   ├── CodeEditor.tsx        # CodeMirror 6 editor wrapper
│   │   ├── Preview.tsx           # Live preview with iframe
│   │   ├── Console.tsx           # Console output panel
│   │   ├── PackageManager.tsx    # NPM package search & install
│   │   └── TemplateModal.tsx     # Template selection dialog
│   ├── store/
│   │   └── fileSystemStore.ts    # Zustand store (files, packages, templates)
│   ├── types/
│   │   └── fileSystem.ts         # TypeScript type definitions
│   ├── utils/
│   │   ├── bundler.ts            # ESBuild bundler with plugins
│   │   ├── npmApi.ts             # NPM registry API wrapper
│   │   ├── dependencyResolver.ts # Peer dependency resolver
│   │   ├── templates/            # Project templates
│   │   │   ├── index.ts          # Template exports
│   │   │   ├── types.ts          # Template types
│   │   │   ├── defaultTemplate.ts # Plain React template
│   │   │   └── muiTemplate.ts    # Material UI template
│   │   └── resolvers/            # Dependency resolvers
│   │       ├── index.ts          # Resolver factory
│   │       ├── baseResolver.ts   # Standard React resolver
│   │       └── muiResolver.ts    # MUI with external handling
│   ├── App.tsx                   # Main app with layout
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── public/
│   └── esbuild.wasm             # ESBuild WebAssembly binary
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 📖 Usage

### Choosing a Template

1. Click the **Templates** button (layers icon) in the top toolbar
2. Select from available templates:
   - **Plain React**: Lightweight starter with gradient UI
   - **Material UI**: Full MUI setup with component examples
3. Confirm to replace all files (warning: this clears current work)

### Creating Files & Folders

**From Toolbar:**

1. Click "New File" or "New Folder" in the top toolbar
2. Enter name and press Enter (or click Create)

**From File Tree (Hover Actions):**

1. Hover over any folder in the tree
2. Click the folder/file icon that appears
3. Type name inline and press Enter
4. Press Escape to cancel

### Editing Files

1. Click any file in the tree to open it
2. Start typing in the editor
3. Changes auto-save to state
4. Preview updates automatically

### Renaming & Deleting

**Hover over any folder:**

- 📄 **New File** button
- 📁 **New Folder** button
- ✏️ **Rename** button (folders only)
- 🗑️ **Delete** button

**Hover over any file:**

- 🗑️ **Delete** button

### Installing Packages

1. Click the **Dependencies** button to expand the panel
2. Search for packages in the search box
3. Click **Add** on any package
4. Select version and click **Install**
5. Package and dependencies auto-install
6. View installed packages in the list
7. Hover and click trash icon to uninstall

### Using Installed Packages

```javascript
// Just import them in your code
import { Button } from "@mui/material";
import axios from "axios";

// They'll be automatically resolved via esm.sh
```

### Viewing Console Output

- Console logs appear automatically in the bottom panel
- Color-coded: errors (red), warnings (yellow), info (blue), logs (white)
- Click "Clear" to clear console output
- Toggle with chevron icon to expand/collapse

## 🏗️ Architecture

### Bundling Flow

1. **File Changes** → Zustand store updates
2. **Bundler Triggered** → ESBuild compiles JSX/TSX to JS
3. **Dependency Resolution** → Appropriate resolver detects package type
4. **Import Map Generation** → Creates ESM import map for esm.sh
5. **Code Injection** → Bundles with React runtime and user code
6. **Iframe Render** → Sandboxed execution with console capture

### Resolver Strategy

The app automatically selects the right resolver based on installed packages:

**Base Resolver** (default):

- Standard React packages
- Uses `https://esm.sh/package@version` format

**MUI Resolver** (when MUI detected):

- Adds `?external=react,react-dom` to prevent multiple React instances
- Handles `@emotion/*` packages properly
- Adds JSX runtime for Emotion

### Virtual File System

- In-memory file structure stored in Zustand
- ESBuild plugin resolves imports from virtual FS
- Supports relative imports: `import './Component'`
- Package imports resolved via import maps

## ✅ Features Checklist

- ✅ Hierarchical file system with CRUD operations
- ✅ Nested folders with hover actions
- ✅ CodeMirror 6 code editor with syntax highlighting
- ✅ Resizable panels (horizontal & vertical)
- ✅ File type icons
- ✅ Auto-save functionality
- ✅ TypeScript/JSX/TSX support
- ✅ Dark theme UI
- ✅ Live preview with iframe isolation
- ✅ Console output capture
- ✅ React 18 execution with JSX
- ✅ ESM package imports via esm.sh
- ✅ NPM package search and install
- ✅ Automatic peer dependency resolution
- ✅ Multiple project templates
- ✅ Material UI support with proper external handling
- ✅ Template switching with state reset

## 🎯 Future Enhancements

- [ ] TypeScript type checking in editor
- [ ] Multiple file upload/import
- [ ] Export project as ZIP
- [ ] Share playground via URL
- [ ] Dark/Light theme toggle
- [ ] More templates (Vue, Svelte, Solid)
- [ ] Code formatting (Prettier)
- [ ] Cloud save/load projects

## 🐛 Troubleshooting

### Preview not updating

- Check browser console for errors
- Ensure all imports are installed in Dependencies panel
- Try clearing console and refreshing

### Package installation fails

- Verify package name is correct on npm
- Check if package has peer dependencies that conflict
- Some packages may not work in browser environment

### Material UI styles not working

- Ensure you're using the Material UI template
- Check that `@emotion/react` and `@emotion/styled` are installed
- The app uses the MUI resolver automatically when MUI is detected

### TypeScript errors

- The editor shows syntax highlighting but doesn't do type checking yet
- TypeScript/TSX files are transpiled to JavaScript for execution
- Type errors won't prevent code from running

## 💡 Tips

- Use **Cmd/Ctrl + S** - Auto-saves, but manual save triggers re-bundle
- Hover over folders to reveal quick actions
- Drag panel borders to resize sections
- Check console output for runtime errors
- Install packages before importing them
- Templates come with working examples to start from

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.
