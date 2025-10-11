import React from "react";
import {
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscChevronRight,
  VscChevronDown,
} from "react-icons/vsc";
import { SiJavascript, SiHtml5, SiCss3, SiJson, SiReact } from "react-icons/si";
import { useFileSystemStore } from "../store/fileSystemStore";
import { type FileNode } from "../types/fileSystem";

interface FileTreeItemProps {
  name: string;
  path: string;
  node: FileNode;
  depth: number;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const iconClass = "w-4 h-4";

  switch (ext) {
    case "js":
      return <SiJavascript className={`${iconClass} text-yellow-400`} />;
    case "jsx":
      return <SiReact className={`${iconClass} text-cyan-400`} />;
    case "ts":
      return <SiJavascript className={`${iconClass} text-blue-500`} />;
    case "tsx":
      return <SiReact className={`${iconClass} text-blue-400`} />;
    case "html":
      return <SiHtml5 className={`${iconClass} text-orange-500`} />;
    case "css":
      return <SiCss3 className={`${iconClass} text-blue-400`} />;
    case "json":
      return <SiJson className={`${iconClass} text-yellow-300`} />;
    default:
      return <VscFile className={`${iconClass} text-gray-400`} />;
  }
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  name,
  path,
  node,
  depth,
}) => {
  const { activeFilePath, setActiveFile, toggleFolder, expandedFolders } =
    useFileSystemStore();
  const isActive = activeFilePath === path;
  const isExpanded = expandedFolders.has(path);

  const handleClick = () => {
    if (node.type === "folder") {
      toggleFolder(path);
    } else {
      setActiveFile(path);
    }
  };

  return (
    <>
      <div
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700/50
          ${isActive ? "bg-gray-700" : ""}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <VscChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <VscChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </span>
        )}

        {node.type === "folder" ? (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <VscFolderOpened className="w-4 h-4 text-blue-400" />
            ) : (
              <VscFolder className="w-4 h-4 text-blue-400" />
            )}
          </span>
        ) : (
          <span className="flex-shrink-0 ml-4">{getFileIcon(name)}</span>
        )}

        <span className="text-sm text-gray-200 truncate select-none">
          {name}
        </span>
      </div>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {Object.entries(node.children)
            .sort(([, a], [, b]) => {
              // Folders first, then files
              if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
            .map(([childName, childNode]) => (
              <FileTreeItem
                key={childName}
                name={childName}
                path={`${path}/${childName}`}
                node={childNode}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </>
  );
};

export const FileTree: React.FC = () => {
  const { files } = useFileSystemStore();

  return (
    <div className="h-full bg-gray-800 overflow-y-auto">
      <div className="p-2 border-b border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Files
        </h2>
      </div>
      <div className="py-1">
        {Object.entries(files)
          .sort(([, a], [, b]) => {
            // Folders first, then files
            if (a.type !== b.type) {
              return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          })
          .map(([name, node]) => (
            <FileTreeItem
              key={name}
              name={name}
              path={name}
              node={node}
              depth={0}
            />
          ))}
      </div>
    </div>
  );
};
