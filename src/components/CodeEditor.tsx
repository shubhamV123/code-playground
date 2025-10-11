import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { useFileSystemStore } from '../store/fileSystemStore';

const getLanguageExtension = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return [javascript({ jsx: true, typescript: ext === 'ts' || ext === 'tsx' })];
    case 'html':
      return [html()];
    case 'css':
      return [css()];
    default:
      return [];
  }
};

export const CodeEditor: React.FC = () => {
  const { activeFilePath, getFileContent, updateFileContent } = useFileSystemStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (activeFilePath) {
      const content = getFileContent(activeFilePath);
      setCode(content || '');
    } else {
      setCode('');
    }
  }, [activeFilePath, getFileContent]);

  const handleChange = (value: string) => {
    setCode(value);
    if (activeFilePath) {
      updateFileContent(activeFilePath, value);
    }
  };

  if (!activeFilePath) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <p className="text-lg">No file selected</p>
          <p className="text-sm mt-2">Select a file from the tree to start editing</p>
        </div>
      </div>
    );
  }

  const fileName = activeFilePath.split('/').pop() || '';
  const extensions = getLanguageExtension(fileName);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-medium">{fileName}</span>
          <span className="text-xs text-gray-500">{activeFilePath}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={code}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
};
