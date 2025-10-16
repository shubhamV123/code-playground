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
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Double buffering: use two iframe slots and alternate between them
  const [iframeSlots, setIframeSlots] = useState<{
    slot1: { key: number; html: string; active: boolean };
    slot2: { key: number; html: string; active: boolean };
  }>({
    slot1: { key: 0, html: "", active: true },
    slot2: { key: -1, html: "", active: false },
  });

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
  const activeSlotRef = useRef<"slot1" | "slot2">("slot1");
  const iframeKeyRef = useRef<number>(0);

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

        // Clean up inactive iframe after active one is ready (double buffering cleanup)
        setIframeSlots((prev) => {
          const activeSlot = activeSlotRef.current;
          const inactiveSlot = activeSlot === "slot1" ? "slot2" : "slot1";
          console.log(
            "[Preview] 🧹 Cleaning up inactive iframe after transition"
          );
          return {
            ...prev,
            [inactiveSlot]: { ...prev[inactiveSlot], html: "" },
          };
        });
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

        // Show runtime errors in preview as well
        if (event.data.method === "error") {
          const errorMsg = event.data.args.join(" ");
          setPreviewError(`Runtime Error: ${errorMsg}`);
        }
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
        // Show build error prominently in preview
        setPreviewError(`Build Error: ${result.error}`);
        setIsLoading(false);

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

      // Clear errors on successful build
      setPreviewError(null);

      // Check if packages changed (need iframe recreation for MUI/Emotion cache)
      const currentPackages = JSON.stringify(getInstalledPackages());
      const packagesChanged = currentPackages !== lastPackagesRef.current;

      // Only do FULL reload for first render or package changes
      // For dependency changes (files added/deleted, imports changed), use instant HMR
      if (isFirstRender.current || packagesChanged) {
        const wasFirstRender = isFirstRender.current;
        isFirstRender.current = false;
        lastPackagesRef.current = currentPackages;

        if (packagesChanged) {
          console.log(
            "[Preview] 📦 Packages changed, full reload required (will fetch from CDN)"
          );
        } else {
          console.log(
            "[Preview] 🚀 Initial load (fetching dependencies from CDN)"
          );
        }

        // Only show loading spinner on first render
        if (wasFirstRender) {
          setIsLoading(true);
          setLoadingMessage("Loading preview...");
        } else {
          console.log(
            "[Preview] 💾 Double buffering: switching iframe slots for package change"
          );
        }

        // Double buffering: alternate between two iframe slots
        const currentActive = activeSlotRef.current;
        const nextActive = currentActive === "slot1" ? "slot2" : "slot1";
        const nextKey = iframeKeyRef.current + 1;

        iframeKeyRef.current = nextKey;
        activeSlotRef.current = nextActive;

        setIframeSlots((prev) => ({
          ...prev,
          [nextActive]: {
            key: nextKey,
            html: result.html,
            active: true,
          },
          [currentActive]: {
            ...prev[currentActive],
            active: false,
          },
        }));

        setIframeKey(nextKey);
        setHtmlContent(result.html);
        setLastUpdate(Date.now());
      } else {
        // Hot Module Reload: Send new code AND CSS to iframe (INSTANT - no CDN calls, no iframe reload)
        // This handles ALL changes: code edits, file add/delete, import changes, etc.
        const iframe = iframeRef.current;

        // Log if this is a dependency change (for debugging)
        if (result.requiresFullReload) {
          console.log(
            "[Preview] ⚡ Dependency change detected (file add/delete/import) - using instant HMR instead of reload"
          );
        }

        console.log("[Preview] 🔥 HMR update", {
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
            const fallbackKey = iframeKeyRef.current + 1;
            iframeKeyRef.current = fallbackKey;
            setIframeKey(fallbackKey);
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
  }, [getInstalledPackages]); // Only depend on getInstalledPackages, use refs for iframe state

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
    setPreviewError(null); // Clear any errors
    // Force iframe recreation on manual refresh with double buffering
    isFirstRender.current = true; // Treat as first render to show loading
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
          {previewError && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">
              Error
            </span>
          )}
          {lastUpdate > 0 && !previewError && (
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
        {/* Iframe Slot 1 */}
        <iframe
          key={iframeSlots.slot1.key}
          ref={iframeSlots.slot1.active ? iframeRef : undefined}
          title="preview-slot-1"
          srcDoc={iframeSlots.slot1.html}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0 absolute inset-0 transition-opacity duration-200"
          style={{
            zIndex: iframeSlots.slot1.active ? 2 : 1,
            opacity: iframeSlots.slot1.html ? 1 : 0,
            pointerEvents: iframeSlots.slot1.active ? "auto" : "none",
          }}
        />

        {/* Iframe Slot 2 */}
        <iframe
          key={iframeSlots.slot2.key}
          ref={iframeSlots.slot2.active ? iframeRef : undefined}
          title="preview-slot-2"
          srcDoc={iframeSlots.slot2.html}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0 absolute inset-0 transition-opacity duration-200"
          style={{
            zIndex: iframeSlots.slot2.active ? 2 : 1,
            opacity: iframeSlots.slot2.html ? 1 : 0,
            pointerEvents: iframeSlots.slot2.active ? "auto" : "none",
          }}
        />

        {/* Loading Overlay */}
        {isLoading && !previewError && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mb-4"></div>
              <p className="text-gray-700 font-medium">{loadingMessage}</p>
              <p className="text-gray-500 text-sm mt-1">Please wait...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {previewError && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10 p-8">
            <div className="max-w-2xl w-full">
              <div className="bg-white rounded-lg shadow-lg border-2 border-red-500 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Preview Error
                    </h3>
                    <div className="bg-red-50 rounded p-4 border border-red-200">
                      <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                        {previewError}
                      </pre>
                    </div>
                    <button
                      onClick={() => setPreviewError(null)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Dismiss Error
                    </button>
                  </div>
                </div>
              </div>
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
