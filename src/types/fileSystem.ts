export type FileType = 'file' | 'folder';

export interface FileNode {
  type: FileType;
  name: string;
  content?: string; // For files only
  children?: Record<string, FileNode>; // For folders only
}

export interface FileSystemState {
  files: Record<string, FileNode>;
  activeFilePath: string | null;
  expandedFolders: Set<string>;
}

export type FileExtension = '.js' | '.jsx' | '.ts' | '.tsx' | '.html' | '.css' | '.json';

export interface FileTreeItem {
  path: string;
  name: string;
  type: FileType;
  depth: number;
  isExpanded?: boolean;
}
