import React, { useEffect, useRef, useState, useCallback } from "react";
import { VscRefresh } from "react-icons/vsc";
import { useFileSystemStore } from "../store/fileSystemStore";
import { bundleFiles } from "../utils/bundler";
import { Console, type ConsoleMessage } from "./Console";

export const Preview: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [htmlContent, setHtmlContent] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const { files } = useFileSystemStore();

  // Handle console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "console") {
        const message: ConsoleMessage = {
          id: `${Date.now()}-${Math.random()}`,
          method: event.data.method,
          args: event.data.args,
          timestamp: Date.now(),
        };
        setConsoleMessages((prev) => [...prev, message]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Bundle and update iframe
  const updatePreview = useCallback(async () => {
    try {
      const result = await bundleFiles(files);

      if (result.error) {
        setConsoleMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-error`,
            method: "error",
            args: [`Build Error: ${result.error}`],
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // Smooth transition: fade out → update → fade in
      setIsTransitioning(true);

      // Wait for fade out animation
      setTimeout(() => {
        // Force iframe recreation by updating key - this ensures Emotion cache starts fresh
        setIframeKey((prev) => prev + 1);
        setHtmlContent(result.html);
        setLastUpdate(Date.now());

        // Fade back in after a brief moment
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    } catch (error) {
      setConsoleMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          method: "error",
          args: [`Bundle Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          timestamp: Date.now(),
        },
      ]);
      setIsTransitioning(false);
    }
  }, [files]);

  // Debounced update on file changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 500ms
    debounceTimerRef.current = setTimeout(() => {
      updatePreview();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [files, updatePreview]);

  const handleRefresh = () => {
    setConsoleMessages([]);
    updatePreview();
  };

  const handleClearConsole = () => {
    setConsoleMessages([]);
  };

  const toggleConsole = () => {
    setIsConsoleExpanded(!isConsoleExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-medium">Preview</span>
          {lastUpdate > 0 && (
            <span className="text-xs text-gray-500">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-700 rounded transition-colors"
          title="Refresh Preview"
        >
          <VscRefresh className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Refresh</span>
        </button>
      </div>

      {/* Preview iframe */}
      <div
        className={`${
          isConsoleExpanded ? "flex-1" : "flex-[2]"
        } bg-white overflow-hidden`}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          title="preview"
          srcDoc={htmlContent}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          className={`w-full h-full border-0 transition-opacity duration-150 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* Console */}
      <div
        className={`${
          isConsoleExpanded ? "h-48" : "h-10"
        } transition-all duration-200`}
      >
        <Console
          messages={consoleMessages}
          onClear={handleClearConsole}
          isExpanded={isConsoleExpanded}
          onToggle={toggleConsole}
        />
      </div>
    </div>
  );
};
