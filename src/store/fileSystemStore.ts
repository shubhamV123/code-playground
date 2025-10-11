import { create } from "zustand";
import { type FileNode } from "../types/fileSystem";

interface FileSystemStore {
  files: Record<string, FileNode>;
  activeFilePath: string | null;
  expandedFolders: Set<string>;

  // Actions
  setActiveFile: (path: string | null) => void;
  toggleFolder: (path: string) => void;
  createFile: (path: string, name: string) => void;
  createFolder: (path: string, name: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (path: string, newName: string) => void;
  updateFileContent: (path: string, content: string) => void;
  getFileContent: (path: string) => string | undefined;
  getNodeAtPath: (path: string) => FileNode | undefined;

  // Package management
  addPackage: (packageName: string, version: string) => void;
  removePackage: (packageName: string) => void;
  getInstalledPackages: () => Record<string, string>;
}

// Default project structure
const defaultFiles: Record<string, FileNode> = {
  "index.html": {
    type: "file",
    name: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.js"></script>
  </body>
</html>`,
  },
  src: {
    type: "folder",
    name: "src",
    children: {
      "App.jsx": {
        type: "file",
        name: "App.jsx",
        content: `import { useState } from 'react';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Hello from Code Playground!</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;`,
      },
      "index.jsx": {
        type: "file",
        name: "index.jsx",
        content: `import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
      },
      "styles.css": {
        type: "file",
        name: "styles.css",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a1a;
  color: #fff;
  padding: 2rem;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #646cff;
}

.card {
  padding: 2rem;
  background: #2a2a2a;
  border-radius: 8px;
}

button {
  background: #646cff;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #535bf2;
}`,
      },
    },
  },
  "package.json": {
    type: "file",
    name: "package.json",
    content: `{
  "name": "code-playground-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
  },
};

// Helper function to get node at path
const getNodeAtPath = (
  files: Record<string, FileNode>,
  path: string
): FileNode | undefined => {
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, FileNode> | undefined = files;
  let node: FileNode | undefined;

  for (let i = 0; i < parts.length; i++) {
    if (!current) return undefined;
    node = current[parts[i]];
    if (!node) return undefined;
    if (i < parts.length - 1) {
      current = node.children;
    }
  }

  return node;
};

// Helper function to set node at path
const setNodeAtPath = (
  files: Record<string, FileNode>,
  path: string,
  node: FileNode | null
): Record<string, FileNode> => {
  const newFiles = JSON.parse(JSON.stringify(files)); // Deep clone
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 1) {
    if (node === null) {
      delete newFiles[parts[0]];
    } else {
      newFiles[parts[0]] = node;
    }
    return newFiles;
  }

  let current: Record<string, FileNode> = newFiles;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || current[part].type !== "folder") {
      return files; // Invalid path
    }
    current = current[part].children!;
  }

  const lastName = parts[parts.length - 1];
  if (node === null) {
    delete current[lastName];
  } else {
    current[lastName] = node;
  }

  return newFiles;
};

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  files: defaultFiles,
  activeFilePath: "src/App.jsx",
  expandedFolders: new Set(["src"]),

  setActiveFile: (path) => set({ activeFilePath: path }),

  toggleFolder: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    }),

  createFile: (path, name) =>
    set((state) => {
      const parentPath = path === "" ? "" : path;
      const fullPath = parentPath ? `${parentPath}/${name}` : name;

      const newFile: FileNode = {
        type: "file",
        name,
        content: "",
      };

      let newFiles: Record<string, FileNode>;
      if (parentPath === "") {
        newFiles = { ...state.files, [name]: newFile };
      } else {
        const parent = getNodeAtPath(state.files, parentPath);
        if (!parent || parent.type !== "folder") return state;

        const updatedParent: FileNode = {
          ...parent,
          children: { ...parent.children, [name]: newFile },
        };
        newFiles = setNodeAtPath(state.files, parentPath, updatedParent);
      }

      return { files: newFiles, activeFilePath: fullPath };
    }),

  createFolder: (path, name) =>
    set((state) => {
      const parentPath = path === "" ? "" : path;

      const newFolder: FileNode = {
        type: "folder",
        name,
        children: {},
      };

      let newFiles: Record<string, FileNode>;
      if (parentPath === "") {
        newFiles = { ...state.files, [name]: newFolder };
      } else {
        const parent = getNodeAtPath(state.files, parentPath);
        if (!parent || parent.type !== "folder") return state;

        const updatedParent: FileNode = {
          ...parent,
          children: { ...parent.children, [name]: newFolder },
        };
        newFiles = setNodeAtPath(state.files, parentPath, updatedParent);
      }

      return { files: newFiles };
    }),

  deleteNode: (path) =>
    set((state) => {
      const newFiles = setNodeAtPath(state.files, path, null);
      const activeFilePath =
        state.activeFilePath === path ? null : state.activeFilePath;
      return { files: newFiles, activeFilePath };
    }),

  renameNode: (path, newName) =>
    set((state) => {
      const node = getNodeAtPath(state.files, path);
      if (!node) return state;

      const renamedNode: FileNode = { ...node, name: newName };
      const parts = path.split("/").filter(Boolean);
      const parentPath = parts.slice(0, -1).join("/");
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;

      // Delete old node and create new one with new name
      let newFiles = setNodeAtPath(state.files, path, null);

      if (parentPath === "") {
        newFiles = { ...newFiles, [newName]: renamedNode };
      } else {
        const parent = getNodeAtPath(newFiles, parentPath);
        if (!parent || parent.type !== "folder") return state;

        const updatedParent: FileNode = {
          ...parent,
          children: { ...parent.children, [newName]: renamedNode },
        };
        newFiles = setNodeAtPath(newFiles, parentPath, updatedParent);
      }

      const activeFilePath =
        state.activeFilePath === path ? newPath : state.activeFilePath;
      return { files: newFiles, activeFilePath };
    }),

  updateFileContent: (path, content) =>
    set((state) => {
      const node = getNodeAtPath(state.files, path);
      if (!node || node.type !== "file") return state;

      const updatedNode: FileNode = { ...node, content };
      const newFiles = setNodeAtPath(state.files, path, updatedNode);
      return { files: newFiles };
    }),

  getFileContent: (path) => {
    const node = getNodeAtPath(get().files, path);
    return node?.type === "file" ? node.content : undefined;
  },

  getNodeAtPath: (path) => {
    return getNodeAtPath(get().files, path);
  },

  // Package management
  addPackage: (packageName, version) =>
    set((state) => {
      const packageJsonNode = state.files["package.json"];
      if (!packageJsonNode || packageJsonNode.type !== "file") return state;

      try {
        const packageJson = JSON.parse(packageJsonNode.content || "{}");

        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }

        packageJson.dependencies[packageName] = `^${version}`;

        const updatedNode: FileNode = {
          ...packageJsonNode,
          content: JSON.stringify(packageJson, null, 2),
        };

        const newFiles = setNodeAtPath(state.files, "package.json", updatedNode);
        return { files: newFiles };
      } catch (error) {
        console.error("Failed to add package:", error);
        return state;
      }
    }),

  removePackage: (packageName) =>
    set((state) => {
      const packageJsonNode = state.files["package.json"];
      if (!packageJsonNode || packageJsonNode.type !== "file") return state;

      try {
        const packageJson = JSON.parse(packageJsonNode.content || "{}");

        if (packageJson.dependencies && packageJson.dependencies[packageName]) {
          delete packageJson.dependencies[packageName];
        }

        const updatedNode: FileNode = {
          ...packageJsonNode,
          content: JSON.stringify(packageJson, null, 2),
        };

        const newFiles = setNodeAtPath(state.files, "package.json", updatedNode);
        return { files: newFiles };
      } catch (error) {
        console.error("Failed to remove package:", error);
        return state;
      }
    }),

  getInstalledPackages: () => {
    const state = get();
    const packageJsonNode = state.files["package.json"];

    if (!packageJsonNode || packageJsonNode.type !== "file") {
      return {};
    }

    try {
      const packageJson = JSON.parse(packageJsonNode.content || "{}");
      return packageJson.dependencies || {};
    } catch (error) {
      console.error("Failed to parse package.json:", error);
      return {};
    }
  },
}));
