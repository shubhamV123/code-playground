# Code Playground - Phase 1 Complete

A browser-based code playground similar to playcode.io, built with React, TypeScript, and modern web technologies.

## Phase 1 Features (Completed)

### File System Management
- **Hierarchical File Tree**: Browse files and folders in a tree structure
- **File/Folder Operations**:
  - Create new files and folders
  - Delete files and folders
  - Rename files and folders
  - Expand/collapse folders
- **File Type Icons**: Visual icons for different file types (.js, .jsx, .html, .css, .json)
- **Active File Highlighting**: Current file is highlighted in the tree

### Code Editor
- **CodeMirror 6 Integration**: Modern, fast code editor
- **Syntax Highlighting**: Support for JavaScript, JSX, TypeScript, HTML, and CSS
- **Auto-save**: Changes are automatically saved to state
- **Line Numbers**: Code with line numbers and gutters
- **Dark Theme**: OneDark theme for comfortable coding

### Layout
- **Resizable Panels**: Three-panel layout with adjustable sizes:
  - Left: File tree (20% default)
  - Middle: Code editor (50% default)
  - Right: Preview panel (30% default)
- **Responsive Design**: Clean, modern dark-themed UI

### Default Project
- Pre-configured React project structure with:
  - `index.html` - Entry point
  - `src/App.jsx` - Sample React component
  - `src/index.js` - React rendering logic
  - `src/styles.css` - Basic styles
  - `package.json` - Project metadata

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **CodeMirror 6** - Code editor
- **Tailwind CSS** - Styling
- **react-resizable-panels** - Resizable layout
- **react-icons** - File type icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at `http://localhost:5173`

## Project Structure

```
code-playground/
├── src/
│   ├── components/
│   │   ├── FileTree.tsx       # File tree component
│   │   ├── FileToolbar.tsx    # File operations toolbar
│   │   ├── CodeEditor.tsx     # CodeMirror editor wrapper
│   │   └── Preview.tsx        # Preview panel (Phase 2)
│   ├── store/
│   │   └── fileSystemStore.ts # Zustand state management
│   ├── types/
│   │   └── fileSystem.ts      # TypeScript interfaces
│   ├── App.tsx                # Main application
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Usage

### Creating Files/Folders
1. Click the "New File" or "New Folder" button in the toolbar
2. Enter the name and press Enter or click "Create"
3. Press Escape to cancel

### Editing Files
1. Click on any file in the tree to open it
2. Start typing - changes are auto-saved
3. File content is persisted in application state

### Renaming Files/Folders
1. Select a file or folder
2. Click the "Rename" button
3. Enter new name and press Enter

### Deleting Files/Folders
1. Select a file or folder
2. Click the "Delete" button
3. Confirm the deletion

## Next Steps (Future Phases)

### Phase 2: Vanilla JS/HTML/CSS Execution
- Iframe-based preview with sandboxing
- Combine HTML/CSS/JS files for preview
- Console output panel
- Debounced execution

### Phase 3: ESM Import Support
- Parse import statements
- Generate import maps for esm.sh
- Dynamic package resolution

### Phase 4: React/JSX Support
- Babel Standalone integration
- Web Worker for JSX transformation
- React runtime injection
- Caching transformed output

### Phase 5: Dependency Management
- Auto-detect imports
- Package version management
- Visual dependencies panel
- esm.sh integration

## Features Checklist

- ✅ File system with CRUD operations
- ✅ Hierarchical folder structure
- ✅ Syntax-highlighted code editor
- ✅ Resizable panels
- ✅ File type icons
- ✅ Auto-save functionality
- ✅ TypeScript support
- ✅ Dark theme UI
- ⏳ Live preview (Phase 2)
- ⏳ Console output (Phase 2)
- ⏳ React/JSX execution (Phase 4)
- ⏳ Package imports (Phase 3)

## License

MIT
