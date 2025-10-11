import React, { useState } from 'react';
import { VscNewFile, VscNewFolder, VscTrash, VscEdit, VscPackage } from 'react-icons/vsc';
import { useFileSystemStore } from '../store/fileSystemStore';
import { PackageManager } from './PackageManager';

export const FileToolbar: React.FC = () => {
  const { activeFilePath, createFile, createFolder, deleteNode, renameNode } =
    useFileSystemStore();
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleCreateFile = () => {
    if (inputValue.trim()) {
      createFile('', inputValue.trim());
      setInputValue('');
      setShowNewFileInput(false);
    }
  };

  const handleCreateFolder = () => {
    if (inputValue.trim()) {
      createFolder('', inputValue.trim());
      setInputValue('');
      setShowNewFolderInput(false);
    }
  };

  const handleRename = () => {
    if (inputValue.trim() && activeFilePath) {
      const newName = inputValue.trim();
      renameNode(activeFilePath, newName);
      setInputValue('');
      setShowRenameInput(false);
    }
  };

  const handleDelete = () => {
    if (activeFilePath && confirm(`Delete ${activeFilePath}?`)) {
      deleteNode(activeFilePath);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void,
    cancel: () => void
  ) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      cancel();
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowNewFileInput(true);
            setShowNewFolderInput(false);
            setShowRenameInput(false);
          }}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="New File"
        >
          <VscNewFile className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={() => {
            setShowNewFolderInput(true);
            setShowNewFileInput(false);
            setShowRenameInput(false);
          }}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="New Folder"
        >
          <VscNewFolder className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={() => {
            if (activeFilePath) {
              const currentName = activeFilePath.split('/').pop() || '';
              setInputValue(currentName);
              setShowRenameInput(true);
              setShowNewFileInput(false);
              setShowNewFolderInput(false);
            }
          }}
          disabled={!activeFilePath}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Rename"
        >
          <VscEdit className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={handleDelete}
          disabled={!activeFilePath}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Delete"
        >
          <VscTrash className="w-4 h-4 text-gray-300" />
        </button>

        <div className="ml-auto">
          <button
            onClick={() => setShowPackageManager(true)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Package Manager"
          >
            <VscPackage className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      <PackageManager
        isOpen={showPackageManager}
        onClose={() => setShowPackageManager(false)}
      />

      {showNewFileInput && (
        <div className="mt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                handleCreateFile,
                () => {
                  setShowNewFileInput(false);
                  setInputValue('');
                }
              )
            }
            placeholder="filename.js"
            className="w-full px-2 py-1 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCreateFile}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFileInput(false);
                setInputValue('');
              }}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showNewFolderInput && (
        <div className="mt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                handleCreateFolder,
                () => {
                  setShowNewFolderInput(false);
                  setInputValue('');
                }
              )
            }
            placeholder="folder-name"
            className="w-full px-2 py-1 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolderInput(false);
                setInputValue('');
              }}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showRenameInput && (
        <div className="mt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                handleRename,
                () => {
                  setShowRenameInput(false);
                  setInputValue('');
                }
              )
            }
            placeholder="new-name"
            className="w-full px-2 py-1 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleRename}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              Rename
            </button>
            <button
              onClick={() => {
                setShowRenameInput(false);
                setInputValue('');
              }}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
