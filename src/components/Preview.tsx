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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Initializing preview..."
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isFirstRender = useRef(true);
  const files = useFileSystemStore((s) => s.files);
  const getInstalledPackages = useFileSystemStore(
    (s) => s.getInstalledPackages
  );
  const filesRef = useRef(files);
  const lastPackagesRef = useRef<string>("");
  const htmlUpdateTimeRef = useRef<number>(0);

  // Initialize package ref once
  useEffect(() => {
    if (lastPackagesRef.current === "") {
      lastPackagesRef.current = JSON.stringify(getInstalledPackages());
    }
  }, [getInstalledPackages]);

  // Keep files ref up to date
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Track when HTML content actually changes
  useEffect(() => {
    if (htmlContent) {
      const now = performance.now();
      htmlUpdateTimeRef.current = now;
    }
  }, [htmlContent]);

  // Track iframe load state
  const iframeReadyRef = useRef(false);

  // Track iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Mark as not ready when iframe is recreated
    iframeReadyRef.current = false;

    const handleLoad = () => {
      console.log("[Preview] 📺 Iframe loaded and ready for HMR");
      iframeReadyRef.current = true;

      // Hide loading after a short delay to ensure content is rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [iframeKey]); // Re-attach on iframe recreation

  // Handle console messages and hot reload from iframe
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

  // Bundle and update iframe (memoized to avoid recreation)
  const updatePreview = useCallback(async () => {
    setLoadingMessage("Bundling code...");

    try {
      const result = await bundleFiles(filesRef.current);

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
        isFirstRender.current = false;
        lastPackagesRef.current = currentPackages;

        if (packagesChanged) {
          console.log(
            "[Preview] Packages changed, full reload required (will fetch from CDN)"
          );
        } else {
          console.log(
            "[Preview] Initial load (fetching dependencies from CDN)"
          );
        }

        setIsLoading(true);
        setLoadingMessage("Loading preview...");
        setIframeKey((prev) => prev + 1);
        setHtmlContent(result.html);
        setLastUpdate(Date.now());
      } else {
        // Hot Module Reload: Send new code AND CSS to iframe (no CDN calls, no flicker)
        const iframe = iframeRef.current;

        console.log("[Preview] 🔍 Attempting HMR...", {
          iframeExists: !!iframe,
          hasContentWindow: !!iframe?.contentWindow,
          iframeReady: iframeReadyRef.current,
          htmlLength: result.html.length,
        });

        // Check if iframe is ready for HMR
        if (!iframeReadyRef.current) {
          console.warn(
            "[Preview] ⏳ Iframe not fully loaded yet, skipping this update"
          );
          return;
        }

        if (iframe && iframe.contentWindow) {
          try {
            // Extract the bundled JavaScript from HTML (last script type="module" tag)
            const scriptMatches = Array.from(
              result.html.matchAll(
                /<script type="module">([\s\S]*?)<\/script>/g
              )
            );

            // Get the LAST script tag (the app code, not the console interceptor)
            const scriptMatch =
              scriptMatches.length > 0
                ? scriptMatches[scriptMatches.length - 1]
                : null;

            console.log("[Preview] 🔍 Script extraction:", {
              totalScripts: scriptMatches.length,
              found: !!scriptMatch,
              scriptLength: scriptMatch ? scriptMatch[1].length : 0,
            });

            // Extract ALL CSS from HTML (handle multiple style tags)
            const cssMatches = result.html.matchAll(
              /<style[^>]*>\s*([\s\S]*?)\s*<\/style>/g
            );
            const cssContent = Array.from(cssMatches)
              .map((match) => match[1])
              .join("\n");

            if (scriptMatch) {
              const appCode = scriptMatch[1].trim();

              console.log(
                "[Preview] ✅ HMR: Sending hot reload update (no external API calls, no flicker)"
              );

              // Send the new app code AND CSS to the iframe for execution
              // NOTE: We don't access iframe.contentWindow.document to avoid cross-origin errors
              // The message handler inside the iframe will process this
              iframe.contentWindow.postMessage(
                {
                  type: "hot-module-reload",
                  code: appCode,
                  css: cssContent,
                },
                "*"
              );

              setLastUpdate(Date.now());
            } else {
              throw new Error("Could not find script tag in HTML");
            }
          } catch (error) {
            // Fallback: full reload if extraction fails
            console.error(
              "[Preview] ⚠️ HMR extraction failed, falling back to full reload:",
              error
            );
            setIsLoading(true);
            setLoadingMessage("Reloading preview...");
            setIframeKey((prev) => prev + 1);
            setHtmlContent(result.html);
            setLastUpdate(Date.now());
          }
        } else {
          // Iframe not ready yet - skip this update, next debounce will catch it
          console.warn(
            "[Preview] ⏳ Iframe not ready, skipping update (will retry on next change)"
          );
          setLastUpdate(Date.now());
        }
      }
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
  }, [getInstalledPackages]); // Only depend on getInstalledPackages, use filesRef

  // Debounced update on file changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 300ms debounce (prevents too many updates while typing)
    debounceTimerRef.current = setTimeout(() => {
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
        } bg-white overflow-hidden relative`}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          title="preview"
          srcDoc={htmlContent}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mb-4"></div>
              <p className="text-gray-700 font-medium">{loadingMessage}</p>
              <p className="text-gray-500 text-sm mt-1">Please wait...</p>
            </div>
          </div>
        )}
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
