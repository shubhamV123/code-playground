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
  const [htmlContent, setHtmlContent] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);
  const files = useFileSystemStore((s) => s.files);
  const getInstalledPackages = useFileSystemStore(
    (s) => s.getInstalledPackages
  );
  const lastPackagesRef = useRef<string>(
    JSON.stringify(getInstalledPackages())
  );

  // Handle console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // SECURITY: Validate message origin to prevent malicious messages
      // In production, you should validate against your specific origin
      // For development, we check it's from the same origin or iframe
      if (event.source !== iframeRef.current?.contentWindow) {
        return; // Ignore messages not from our iframe
      }

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
    const startTime = performance.now();
    try {
      const result = await bundleFiles(files);
      const bundleTime = performance.now() - startTime;
      console.log(`[Preview] Bundle time: ${bundleTime.toFixed(2)}ms`);

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

      // Check if packages changed (need iframe recreation for MUI/Emotion cache)
      const currentPackages = JSON.stringify(getInstalledPackages());
      const packagesChanged = currentPackages !== lastPackagesRef.current;

      if (isFirstRender.current || packagesChanged) {
        console.log(
          "[Preview] First render or packages changed, recreating iframe..."
        );
        isFirstRender.current = false;
        lastPackagesRef.current = currentPackages;
        setIframeKey((prev) => prev + 1);
      } else {
        console.log(
          "[Preview] Packages unchanged, updating content only (FAST)..."
        );
      }

      setHtmlContent(result.html);
      setLastUpdate(Date.now());

      const totalTime = performance.now() - startTime;
      console.log(`[Preview] Total update time: ${totalTime.toFixed(2)}ms`);
    } catch (error) {
      setConsoleMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          method: "error",
          args: [
            `Bundle Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          ],
          timestamp: Date.now(),
        },
      ]);
    }
  }, [files, getInstalledPackages]);

  // Debounced update on file changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 300ms debounce (faster feedback)
    debounceTimerRef.current = setTimeout(() => {
      console.log("[Preview] Debounce triggered, starting update...");
      updatePreview();
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [files, updatePreview]);

  const handleRefresh = () => {
    setConsoleMessages([]);
    // Force iframe recreation on manual refresh
    setIframeKey((prev) => prev + 1);
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
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0"
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
