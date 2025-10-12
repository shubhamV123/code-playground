import { type FileNode } from "../../types/fileSystem";

export type TemplateType = "react" | "mui";

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
  files: Record<string, FileNode>;
  packages: Record<string, string>;
}
