import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FileTree } from "./components/FileTree";
import { FileToolbar } from "./components/FileToolbar";
import { CodeEditor } from "./components/CodeEditor";
import { Preview } from "./components/Preview";
import { PackageManager } from "./components/PackageManager";
import { TemplateModal } from "./components/TemplateModal";
import { useFileSystemStore } from "./store/fileSystemStore";
import { type Template } from "./utils/templates";

function App() {
  const [isDependenciesExpanded, setIsDependenciesExpanded] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const { loadTemplate } = useFileSystemStore();

  const handleSelectTemplate = (template: Template) => {
    loadTemplate(template);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-200">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h1 className="text-lg font-semibold text-white">Code Playground</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Left Panel - File Tree & Dependencies */}
            <Panel defaultSize={20} minSize={15} maxSize={35}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                  <div className="h-full flex flex-col">
                    <FileToolbar
                      onToggleDependencies={() =>
                        setIsDependenciesExpanded(!isDependenciesExpanded)
                      }
                      onToggleTemplates={() => setIsTemplateModalOpen(true)}
                    />
                    <div className="flex-1 overflow-hidden min-h-0">
                      <FileTree />
                    </div>
                  </div>
                </Panel>

                {isDependenciesExpanded && (
                  <>
                    <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
                    <Panel defaultSize={40} minSize={20}>
                      <PackageManager
                        isExpanded={isDependenciesExpanded}
                        onToggle={() =>
                          setIsDependenciesExpanded(!isDependenciesExpanded)
                        }
                      />
                    </Panel>
                  </>
                )}

                {!isDependenciesExpanded && (
                  <div className="flex-shrink-0">
                    <PackageManager
                      isExpanded={isDependenciesExpanded}
                      onToggle={() =>
                        setIsDependenciesExpanded(!isDependenciesExpanded)
                      }
                    />
                  </div>
                )}
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

            {/* Middle Panel - Code Editor */}
            <Panel defaultSize={50} minSize={30}>
              <CodeEditor />
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

            {/* Right Panel - Preview */}
            <Panel defaultSize={30} minSize={20}>
              <Preview />
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

export default App;
