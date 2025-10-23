import React, { useEffect, useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { useFileSystemStore } from '../store/fileSystemStore';
import themeData from 'monaco-themes/themes/Tomorrow-Night.json';

const getLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'vue':
      // Vue SFC - use HTML for template highlighting
      return 'html';
    case 'svelte':
      // Svelte component - use HTML for template highlighting
      return 'html';
    default:
      return 'plaintext';
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

  const handleEditorDidMount = (monaco: Monaco) => {
    // Define Tomorrow Night theme from monaco-themes
    monaco.editor.defineTheme('tomorrow-night', themeData as any);
    monaco.editor.setTheme('tomorrow-night');

    // Configure JavaScript/TypeScript language features for better JSX highlighting
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Enable JSX in JavaScript
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      allowJs: true,
    });

    // Enable JSX in TypeScript
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
    });
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
  const language = getLanguage(fileName);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-medium">{fileName}</span>
          <span className="text-xs text-gray-500">{activeFilePath}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => handleChange(value || '')}
          theme="tomorrow-night"
          beforeMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordWrap: 'off',
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoIndent: 'full',
            'semanticHighlighting.enabled': true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
};
