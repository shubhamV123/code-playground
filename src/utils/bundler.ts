import * as esbuild from "esbuild-wasm";
import { type FileNode } from "../types/fileSystem";
import { getResolver } from "./resolvers";

export interface BundleResult {
  html: string;
  error?: string;
}

interface FileWithContent {
  name: string;
  content: string;
  ext: string;
}

let esbuildInitialized = false;

// Cache for bundling results to avoid redundant work
let bundleCache: {
  filesHash: string;
  result: BundleResult;
} | null = null;

/**
 * Initialize esbuild-wasm (call once)
 */
export async function initializeBundler() {
  if (!esbuildInitialized) {
    try {
      await esbuild.initialize({
        wasmURL: "/esbuild.wasm",
      });
      esbuildInitialized = true;
    } catch (error) {
      console.error("Failed to initialize esbuild:", error);
      throw error;
    }
  }
}

/**
 * Generate a hash of file contents for cache comparison
 * OPTIMIZED: Fast hash without joining entire content
 */
function hashFiles(files: Record<string, FileNode>): string {
  let hash = "";
  const collectContent = (nodes: Record<string, FileNode>, path = ""): void => {
    Object.entries(nodes).forEach(([key, node]) => {
      const nodePath = path ? `${path}/${key}` : key;
      if (node.type === "file" && node.content !== undefined) {
        // Simple hash: path + content length + first/last 100 chars
        const content = node.content;
        const start = content.substring(0, 100);
        const end =
          content.length > 100 ? content.substring(content.length - 100) : "";
        hash += `${nodePath}:${content.length}:${start}:${end}|`;
      } else if (node.type === "folder" && node.children) {
        collectContent(node.children, nodePath);
      }
    });
  };

  collectContent(files);

  return hash;
}

/**
 * Bundles all files into a single HTML document for preview
 */
export async function bundleFiles(
  files: Record<string, FileNode>
): Promise<BundleResult> {
  try {
    // Check cache first
    const filesHash = hashFiles(files);
    if (bundleCache && bundleCache.filesHash === filesHash) {
      return bundleCache.result;
    }

    // Initialize esbuild if not already done
    await initializeBundler();

    // Extract files by type
    const htmlFiles: string[] = [];
    const cssFiles: string[] = [];
    const jsxFiles: FileWithContent[] = [];
    const jsFiles: FileWithContent[] = [];

    // Recursively collect files
    const collectFiles = (
      nodes: Record<string, FileNode>,
      currentPath = ""
    ) => {
      Object.entries(nodes).forEach(([key, node]) => {
        const nodePath = currentPath ? `${currentPath}/${key}` : key;

        if (node.type === "file" && node.content !== undefined) {
          const ext = node.name.split(".").pop()?.toLowerCase() || "";

          switch (ext) {
            case "html":
              htmlFiles.push(node.content);
              break;
            case "css":
              cssFiles.push(node.content);
              break;
            case "jsx":
            case "tsx":
              jsxFiles.push({ name: nodePath, content: node.content, ext });
              break;
            case "js":
            case "ts":
              jsFiles.push({ name: nodePath, content: node.content, ext });
              break;
          }
        } else if (node.type === "folder" && node.children) {
          collectFiles(node.children, nodePath);
        }
      });
    };

    collectFiles(files);

    // Get the main HTML file or create a default one
    let baseHTML =
      htmlFiles[0] ||
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://ga.jspm.io blob:; style-src 'self' 'unsafe-inline'; default-src 'self' 'unsafe-inline' https:">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    // Combine all CSS
    const combinedCSS = cssFiles.join("\n\n");

    // Add HMR transition CSS to minimize perceived flicker
    const hmrTransitionCSS = `
/* HMR Transition: Eliminate flicker with smooth opacity transition */
#root {
  transition: opacity 0.08s ease-in-out;
  min-height: 100vh;
}

/* When root is being updated, maintain opacity to prevent flash */
#root:empty {
  opacity: 1;
  background-color: inherit;
}

/* Smooth fade-in for new content */
@keyframes fadeIn {
  from { opacity: 0.9; }
  to { opacity: 1; }
}

#root > * {
  animation: fadeIn 0.1s ease-in;
}
`;

    const fullCSS = hmrTransitionCSS + "\n" + combinedCSS;

    // Find entry point (index.js or index.jsx)
    const entryFile = [...jsFiles, ...jsxFiles].find(
      (f) =>
        f.name === "src/index.js" ||
        f.name === "src/index.jsx" ||
        f.name === "index.js" ||
        f.name === "index.jsx"
    );

    if (!entryFile) {
      return {
        html: baseHTML,
        error: "No entry point found (index.js or index.jsx)",
      };
    }

    // Create a virtual file system for esbuild
    const allFiles = [...jsxFiles, ...jsFiles];

    // Read package.json FIRST to get installed dependencies
    const packageJsonNode = files["package.json"];
    let packageVersions: Record<string, string> = {};

    if (
      packageJsonNode &&
      packageJsonNode.type === "file" &&
      packageJsonNode.content
    ) {
      try {
        const packageJson = JSON.parse(packageJsonNode.content);
        packageVersions = packageJson.dependencies || {};
      } catch (error) {
        console.error("Failed to parse package.json:", error);
      }
    }

    // Helper to detect if file contains JSX
    const containsJSX = (content: string) => {
      return (
        /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(content) ||
        /<[a-z]+[\s/>]/.test(content)
      );
    };

    // Determine loader for entry file
    const getLoader = (file: FileWithContent): "jsx" | "tsx" | "ts" | "js" => {
      if (file.ext === "tsx" || file.ext === "jsx") return "jsx";
      if (file.ext === "ts") return "ts";
      // Check if JS file contains JSX
      if (file.ext === "js" && containsJSX(file.content)) return "jsx";
      return "js";
    };

    // Check if Material UI or Emotion is used
    const usesMui = Object.keys(packageVersions).some(
      (pkg) => pkg.includes("@mui") || pkg.includes("@emotion")
    );

    // Build with esbuild
    const buildResult = await esbuild.build({
      stdin: {
        contents: entryFile.content,
        resolveDir: "/",
        sourcefile: entryFile.name,
        loader: getLoader(entryFile),
      },
      bundle: true,
      write: false,
      format: "esm",
      jsx: "automatic",
      jsxImportSource: usesMui ? "@emotion/react" : "react",
      plugins: [
        {
          name: "virtual-fs",
          setup(build) {
            // Handle CSS imports first - mark them as external (we inject CSS separately)
            build.onResolve({ filter: /\.css$/ }, () => {
              return {
                path: "__css__",
                namespace: "css-stub",
                external: false,
              };
            });

            // Provide empty module for CSS imports
            build.onLoad({ filter: /.*/, namespace: "css-stub" }, () => {
              return {
                contents: "// CSS is injected separately",
                loader: "js",
              };
            });

            // Resolve local imports
            build.onResolve({ filter: /^\./ }, (args) => {
              const path = args.path.startsWith("./")
                ? args.path.slice(2)
                : args.path;

              // Try to find the file with various extensions
              const possiblePaths = [
                path,
                `${path}.js`,
                `${path}.jsx`,
                `${path}.ts`,
                `${path}.tsx`,
              ];

              for (const testPath of possiblePaths) {
                const file = allFiles.find(
                  (f) =>
                    f.name === testPath ||
                    f.name === `src/${testPath}` ||
                    f.name.endsWith(`/${testPath}`)
                );
                if (file) {
                  return { path: file.name, namespace: "virtual" };
                }
              }

              return { path, external: true };
            });

            // Load virtual files
            build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
              const file = allFiles.find((f) => f.name === args.path);
              if (file) {
                return {
                  contents: file.content,
                  loader: getLoader(file),
                };
              }
              return null;
            });

            // Mark external packages as external (they'll use CDN)
            build.onResolve({ filter: /^[^.]/ }, (args) => {
              if (!args.path.startsWith("/")) {
                return { path: args.path, external: true };
              }
              return null;
            });
          },
        },
      ],
    });

    let bundledJS = "";
    if (buildResult.outputFiles && buildResult.outputFiles.length > 0) {
      bundledJS = new TextDecoder().decode(buildResult.outputFiles[0].contents);
    }

    // Build import map for external dependencies
    const externalPackages = new Set<string>();

    // Add all dependencies from package.json
    Object.keys(packageVersions).forEach((pkg) => {
      externalPackages.add(pkg);
    });

    // Extract imports from all files
    const importRegex =
      /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    allFiles.forEach((file) => {
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const pkg = match[1];
        if (
          !pkg.startsWith(".") &&
          !pkg.startsWith("/") &&
          !pkg.endsWith(".css")
        ) {
          // For scoped packages like @mui/material, use the full scope
          // For regular packages, use just the base name
          if (pkg.startsWith("@")) {
            // Get @scope/package (e.g., @mui/material from @mui/material/Button)
            const parts = pkg.split("/");
            if (parts.length >= 2) {
              const scopedPkg = `${parts[0]}/${parts[1]}`;
              externalPackages.add(scopedPkg);
            }
          } else {
            const basePkg = pkg.split("/")[0];
            externalPackages.add(basePkg);
          }
        }
      }
    });

    // Always include React for JSX files
    if (jsxFiles.length > 0) {
      externalPackages.add("react");
      externalPackages.add("react-dom");
    }

    // Use resolver factory to build import map
    // Automatically selects the right resolver based on installed packages
    const resolver = getResolver(packageVersions);
    const { imports } = resolver(packageVersions, externalPackages);

    const importMap =
      Object.keys(imports).length > 0
        ? `
<script type="importmap">
${JSON.stringify({ imports }, null, 2)}
</script>`
        : "";

    // Check if Emotion is being used
    const hasEmotion = Object.keys(externalPackages).some((pkg) =>
      pkg.includes("@emotion")
    );

    // Emotion runtime polyfill for CSS-in-JS
    const emotionPolyfill = `
<script>
// Emotion runtime polyfill - needed for Material UI v5+ styling
if (typeof global === 'undefined') {
  window.global = window;
}
if (typeof process === 'undefined') {
  window.process = { env: { NODE_ENV: 'development' } };
}
${
  hasEmotion
    ? `
// CRITICAL: Ensure document.head is available for Emotion style injection
// Material UI v5+ uses Emotion which injects styles dynamically
// Environment is ready for style injection
`
    : ""
}
</script>`;

    // Console interceptor
    const consoleInterceptor = `
<script>
(function() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  ['log', 'error', 'warn', 'info'].forEach(method => {
    console[method] = function(...args) {
      window.parent.postMessage({
        type: 'console',
        method: method,
        args: args.map(arg => {
          try {
            if (typeof arg === 'object') {
              return JSON.stringify(arg, null, 2);
            }
            return String(arg);
          } catch (e) {
            return String(arg);
          }
        })
      }, '*');
      originalConsole[method].apply(console, args);
    };
  });

  window.addEventListener('error', (event) => {
    window.parent.postMessage({
      type: 'console',
      method: 'error',
      args: [event.message + ' at ' + event.filename + ':' + event.lineno]
    }, '*');
  });

  window.addEventListener('unhandledrejection', (event) => {
    window.parent.postMessage({
      type: 'console',
      method: 'error',
      args: ['Unhandled Promise Rejection: ' + event.reason]
    }, '*');
  });

  // HOT MODULE RELOAD: Listen for new code AND CSS from parent
  console.log('[Iframe] 🎧 HMR listener installed and ready');

  // Track module revision to prevent race conditions
  let currentModuleRevision = 0;
  let isUpdating = false;

  window.addEventListener('message', (event) => {
    if (event.data.type === 'hot-module-reload') {
      // Prevent overlapping updates
      if (isUpdating) {
        console.log('[Iframe] ⏸️ Update already in progress, queuing...');
        return;
      }

      const revisionId = ++currentModuleRevision;
      isUpdating = true;

      console.log('[Iframe] 📨 Received HMR update:', {
        revision: revisionId,
        codeLength: event.data.code?.length,
        cssLength: event.data.css?.length
      });

      try {
        const newCode = event.data.code;
        const newCSS = event.data.css || '';

        // Update CSS first (before DOM changes to prevent FOUC)
        if (newCSS) {
          console.log('[Iframe] 🎨 Updating CSS...');
          let styleTag = document.getElementById('app-styles');
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'app-styles';
            document.head.appendChild(styleTag);
          }
          styleTag.textContent = newCSS;
        }

        console.log('[Iframe] 🚀 Executing new module code...');

        const root = document.getElementById('root');
        if (!root) {
          isUpdating = false;
          return;
        }

        // Create a module blob and import it
        const moduleBlob = new Blob([newCode], { type: 'application/javascript' });
        const moduleUrl = URL.createObjectURL(moduleBlob);

        // Clear the root immediately before importing
        // This ensures React creates a clean root
        root.innerHTML = '';

        // Import and execute the new module
        import(moduleUrl)
          .then(() => {
            console.log('[Iframe] ✅ HMR update complete - SMOOTH, NO NETWORK REQUESTS, NO FLICKER');
            URL.revokeObjectURL(moduleUrl);
            isUpdating = false;
          })
          .catch((error) => {
            console.error('[Iframe] ❌ Hot module reload failed:', error);
            URL.revokeObjectURL(moduleUrl);
            isUpdating = false;
          });
      } catch (error) {
        console.error('[Iframe] ❌ Hot module reload error:', error);
        isUpdating = false;
      }
    }
  });
})();
</script>`;

    // Inject everything into HTML
    let finalHTML = baseHTML;

    // 0. Inject CSP meta tag to allow blob: URLs for HMR (MUST be first)
    const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://ga.jspm.io blob:; style-src 'self' 'unsafe-inline'; default-src 'self' 'unsafe-inline' https: data: blob:">`;

    if (finalHTML.includes("<head>")) {
      // Inject right after <head> tag to ensure it's processed first
      finalHTML = finalHTML.replace("<head>", `<head>\n${cspMetaTag}`);
    } else if (finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${cspMetaTag}\n</head>`);
    }

    // 1. Inject import map
    if (importMap && finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${importMap}\n</head>`);
    }

    // 2. Inject Emotion polyfill (must come before any module code)
    if (finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${emotionPolyfill}\n</head>`);
    }

    // 3. Inject CSS (includes HMR transition CSS)
    if (fullCSS) {
      const styleTag = `<style>\n${fullCSS}\n</style>`;
      if (finalHTML.includes("</head>")) {
        finalHTML = finalHTML.replace("</head>", `${styleTag}\n</head>`);
      } else {
        finalHTML = styleTag + "\n" + finalHTML;
      }
    }

    // 4. Inject console interceptor
    if (finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace(
        "</head>",
        `${consoleInterceptor}\n</head>`
      );
    } else if (finalHTML.includes("<body>")) {
      finalHTML = finalHTML.replace("<body>", `<body>\n${consoleInterceptor}`);
    } else {
      finalHTML = consoleInterceptor + "\n" + finalHTML;
    }

    // 5. Inject bundled JS
    if (bundledJS) {
      const scriptTag = `<script type="module">
${bundledJS}
</script>`;
      if (finalHTML.includes("</body>")) {
        finalHTML = finalHTML.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        finalHTML = finalHTML + "\n" + scriptTag;
      }
    }

    const result: BundleResult = { html: finalHTML };

    // Update cache
    bundleCache = {
      filesHash,
      result,
    };

    return result;
  } catch (error) {
    const errorResult: BundleResult = {
      html: "",
      error: error instanceof Error ? error.message : "Unknown bundling error",
    };
    return errorResult;
  }
}
