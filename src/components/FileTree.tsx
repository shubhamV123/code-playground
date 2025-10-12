import React, { useState } from "react";
import {
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscChevronRight,
  VscChevronDown,
  VscNewFile,
  VscNewFolder,
  VscEdit,
  VscTrash,
} from "react-icons/vsc";
import { SiJavascript, SiHtml5, SiCss3, SiJson, SiReact } from "react-icons/si";
import { useFileSystemStore } from "../store/fileSystemStore";
import { type FileNode } from "../types/fileSystem";

interface FileTreeItemProps {
  name: string;
  path: string;
  node: FileNode;
  depth: number;
  onShowContextMenu?: (path: string, x: number, y: number) => void;
  newItemState?: { parentPath: string; type: "file" | "folder" } | null;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
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
  onShowContextMenu,
  newItemState,
  inputValue,
  onInputChange,
  onKeyDown,
}) => {
  const { activeFilePath, setActiveFile, toggleFolder, expandedFolders, deleteNode, renameNode } =
    useFileSystemStore();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(name);
  const isActive = activeFilePath === path;
  const isExpanded = expandedFolders.has(path);

  const handleClick = () => {
    if (node.type === "folder") {
      toggleFolder(path);
    } else {
      setActiveFile(path);
    }
  };

  const handleNewFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowContextMenu) {
      // Trigger new file creation
      if (!expandedFolders.has(path)) {
        toggleFolder(path);
      }
      setTimeout(() => {
        onShowContextMenu(path, 0, 0); // Using x=0, y=0 as a signal for "new file"
      }, 0);
    }
  };

  const handleNewFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowContextMenu) {
      // Trigger new folder creation
      if (!expandedFolders.has(path)) {
        toggleFolder(path);
      }
      setTimeout(() => {
        onShowContextMenu(path, 1, 0); // Using x=1, y=0 as a signal for "new folder"
      }, 0);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(name);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${name}?`)) {
      deleteNode(path);
    }
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== name) {
      renameNode(path, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(name);
    }
  };

  return (
    <>
      <div
        className={`
          group flex items-center justify-between gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700/50 relative
          ${isActive ? "bg-gray-700" : ""}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0 pr-20">
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

          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              className="flex-1 px-1 py-0.5 text-sm bg-gray-600 text-gray-200 border border-blue-500 rounded focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm text-gray-200 truncate select-none">
              {name}
            </span>
          )}
        </div>

        {/* Hover Actions - show for both folders and files */}
        {!isRenaming && (
          <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.type === "folder" && (
              <>
                <button
                  onClick={handleNewFile}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="New File"
                >
                  <VscNewFile className="w-3.5 h-3.5 text-gray-300" />
                </button>
                <button
                  onClick={handleNewFolder}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="New Folder"
                >
                  <VscNewFolder className="w-3.5 h-3.5 text-gray-300" />
                </button>
                <button
                  onClick={handleRename}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="Rename"
                >
                  <VscEdit className="w-3.5 h-3.5 text-gray-300" />
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-600 rounded"
              title="Delete"
            >
              <VscTrash className="w-3.5 h-3.5 text-gray-300" />
            </button>
          </div>
        )}
      </div>

      {node.type === "folder" && isExpanded && (
        <div>
          {/* Render existing children */}
          {node.children && Object.entries(node.children)
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
                onShowContextMenu={onShowContextMenu}
                newItemState={newItemState}
                inputValue={inputValue}
                onInputChange={onInputChange}
                onKeyDown={onKeyDown}
              />
            ))}

          {/* Render inline input for new item if this is the parent folder */}
          {newItemState && newItemState.parentPath === path && (
            <div
              className="flex items-center gap-1 px-2 py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              {/* Chevron space placeholder */}
              {newItemState.type === "folder" ? (
                <span className="flex-shrink-0">
                  <VscChevronRight className="w-4 h-4 text-gray-400 opacity-30" />
                </span>
              ) : (
                <span className="flex-shrink-0 w-4" />
              )}

              {/* File/Folder icon */}
              <span className="flex-shrink-0">
                {newItemState.type === "folder" ? (
                  <VscFolder className="w-4 h-4 text-blue-400" />
                ) : (
                  <VscFile className="w-4 h-4 text-gray-400" />
                )}
              </span>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={newItemState.type === "folder" ? "folder-name" : "filename.js"}
                className="flex-1 px-1 py-0.5 text-sm bg-gray-700 text-gray-200 border border-blue-500 rounded focus:outline-none"
                autoFocus
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const FileTree: React.FC = () => {
  const { files, createFile, createFolder } = useFileSystemStore();
  const [newItemState, setNewItemState] = useState<{
    parentPath: string;
    type: "file" | "folder";
  } | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleShowContextMenu = (path: string, x: number, _y: number) => {
    // x=0 means new file, x=1 means new folder
    if (x === 0) {
      setNewItemState({ parentPath: path, type: "file" });
    } else if (x === 1) {
      setNewItemState({ parentPath: path, type: "folder" });
    }
  };

  const handleCreateItem = () => {
    if (inputValue.trim() && newItemState) {
      if (newItemState.type === "file") {
        createFile(newItemState.parentPath, inputValue.trim());
      } else {
        createFolder(newItemState.parentPath, inputValue.trim());
      }
      setNewItemState(null);
      setInputValue("");
    }
  };

  const handleCancelCreate = () => {
    setNewItemState(null);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateItem();
    } else if (e.key === "Escape") {
      handleCancelCreate();
    }
  };

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
              onShowContextMenu={handleShowContextMenu}
              newItemState={newItemState}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onKeyDown={handleKeyDown}
            />
          ))}
      </div>
    </div>
  );
};
