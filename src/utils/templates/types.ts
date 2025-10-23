import { type FileNode } from "../../types/fileSystem";

export type TemplateType = "react" | "mui" | "vanilla" | "vue" | "svelte";

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
  files: Record<string, FileNode>;
  packages: Record<string, string>;
  defaultActiveFile: string; // Default file to open when template is loaded
}
