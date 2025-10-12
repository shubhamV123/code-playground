import { create } from "zustand";
import { type FileNode } from "../types/fileSystem";
import {
  getDefaultTemplate,
  type Template,
  type TemplateType,
} from "../utils/templates";

interface FileSystemStore {
  files: Record<string, FileNode>;
  activeFilePath: string | null;
  expandedFolders: Set<string>;
  currentTemplate: TemplateType;

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
  addPackages: (packages: Record<string, string>) => void;
  removePackage: (packageName: string) => void;
  getInstalledPackages: () => Record<string, string>;

  // Template management
  loadTemplate: (template: Template) => void;
}

// Get default template (plain React)
const defaultTemplate = getDefaultTemplate();
const defaultFiles: Record<string, FileNode> = defaultTemplate.files;

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

// Helper function to shallow clone a folder node
const shallowCloneFolder = (folder: FileNode): FileNode => {
  return {
    ...folder,
    children: folder.children ? { ...folder.children } : {},
  };
};

// Helper function to set node at path (OPTIMIZED - minimal cloning)
const setNodeAtPath = (
  files: Record<string, FileNode>,
  path: string,
  node: FileNode | null
): Record<string, FileNode> => {
  const parts = path.split("/").filter(Boolean);

  // Root level - shallow clone only the root
  if (parts.length === 1) {
    const newFiles = { ...files };
    if (node === null) {
      delete newFiles[parts[0]];
    } else {
      newFiles[parts[0]] = node;
    }
    return newFiles;
  }

  // Nested - only clone the path we're modifying
  const newFiles = { ...files };
  let current: Record<string, FileNode> = newFiles;

  // Clone each folder in the path
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const folder = current[part];

    if (!folder || folder.type !== "folder") {
      return files; // Invalid path
    }

    // Shallow clone this folder
    const clonedFolder = shallowCloneFolder(folder);
    current[part] = clonedFolder;
    current = clonedFolder.children!;
  }

  // Update the target node
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
  currentTemplate: defaultTemplate.id,

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

        const newFiles = setNodeAtPath(
          state.files,
          "package.json",
          updatedNode
        );
        return { files: newFiles };
      } catch (error) {
        console.error("Failed to add package:", error);
        return state;
      }
    }),

  addPackages: (packages) =>
    set((state) => {
      const packageJsonNode = state.files["package.json"];
      if (!packageJsonNode || packageJsonNode.type !== "file") return state;

      try {
        const packageJson = JSON.parse(packageJsonNode.content || "{}");

        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }

        // Add all packages at once
        Object.entries(packages).forEach(([name, version]) => {
          packageJson.dependencies[name] = `^${version}`;
        });

        const updatedNode: FileNode = {
          ...packageJsonNode,
          content: JSON.stringify(packageJson, null, 2),
        };

        const newFiles = setNodeAtPath(
          state.files,
          "package.json",
          updatedNode
        );
        return { files: newFiles };
      } catch (error) {
        console.error("Failed to add packages:", error);
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

        const newFiles = setNodeAtPath(
          state.files,
          "package.json",
          updatedNode
        );
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

  // Template management
  loadTemplate: (template) => {
    // First, clear the active file to force editor refresh
    set({
      activeFilePath: null,
    });

    // Then load the new template files
    // Using setTimeout to ensure the null state is applied first
    setTimeout(() => {
      set(() => {
        return {
          files: JSON.parse(JSON.stringify(template.files)), // Deep clone
          activeFilePath: "src/App.jsx",
          expandedFolders: new Set(["src"]),
          currentTemplate: template.id,
        };
      });
    }, 0);
  },
}));
