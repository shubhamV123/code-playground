import * as esbuild from "esbuild-wasm";
import { type FileNode } from "../types/fileSystem";
import { getResolver } from "./resolvers";

export interface BundleResult {
  html: string;
  error?: string;
  // Metadata for smart reload decisions
  requiresFullReload?: boolean; // True if dependencies changed (file deleted, imports changed)
  fileList?: string[]; // List of all files in the bundle
  dependencyGraph?: Record<string, string[]>; // Map of file -> imported files
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
  fileList: string[];
  dependencyGraph: Record<string, string[]>;
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

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Generate a hash of file contents for cache comparison
 * FIXED: Now properly detects changes in the middle of files
 */
function hashFiles(files: Record<string, FileNode>): string {
  let hash = "";
  const collectContent = (nodes: Record<string, FileNode>, path = ""): void => {
    Object.entries(nodes).forEach(([key, node]) => {
      const nodePath = path ? `${path}/${key}` : key;
      if (node.type === "file" && node.content !== undefined) {
        // Use full content hash to properly detect all changes
        const contentHash = simpleHash(node.content);
        hash += `${nodePath}:${node.content.length}:${contentHash}|`;
      } else if (node.type === "folder" && node.children) {
        collectContent(node.children, nodePath);
      }
    });
  };

  collectContent(files);

  return hash;
}

/**
 * Extract all imports from a file (excluding commented lines)
 * Returns array of imported paths
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const lines = content.split("\n");

  lines.forEach((line) => {
    // Skip commented lines
    const trimmedLine = line.trim();
    if (
      trimmedLine.startsWith("//") ||
      trimmedLine.startsWith("/*") ||
      trimmedLine.startsWith("*")
    ) {
      return;
    }

    // Match import statements: import X from 'Y' or import 'Y'
    const importRegex =
      /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(line)) !== null) {
      imports.push(match[1]);
    }
  });

  return imports;
}

/**
 * Build dependency graph: maps each file to list of files it imports
 */
function buildDependencyGraph(
  files: Array<{ name: string; content: string }>
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  files.forEach((file) => {
    const imports = extractImports(file.content);
    graph[file.name] = imports;
  });

  return graph;
}

/**
 * Check if dependency graphs are different
 */
function dependencyGraphChanged(
  oldGraph: Record<string, string[]>,
  newGraph: Record<string, string[]>
): boolean {
  // Check if file list changed (files added or deleted)
  const oldFiles = Object.keys(oldGraph).sort();
  const newFiles = Object.keys(newGraph).sort();

  if (oldFiles.length !== newFiles.length) {
    console.log(
      "[Bundler] 📁 File count changed:",
      oldFiles.length,
      "→",
      newFiles.length
    );
    return true;
  }

  if (oldFiles.some((file, i) => file !== newFiles[i])) {
    console.log("[Bundler] 📁 File list changed");
    return true;
  }

  // Check if imports changed for any file
  for (const file of newFiles) {
    const oldImports = (oldGraph[file] || []).sort();
    const newImports = (newGraph[file] || []).sort();

    if (oldImports.length !== newImports.length) {
      console.log(
        `[Bundler] 📦 Imports changed for ${file}:`,
        oldImports.length,
        "→",
        newImports.length
      );
      return true;
    }

    if (oldImports.some((imp, i) => imp !== newImports[i])) {
      console.log(`[Bundler] 📦 Import statements changed for ${file}`);
      return true;
    }
  }

  return false;
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
    const cssFilesMap = new Map<string, string>(); // Map of path -> content
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
              // Store CSS files with their paths so we can track imports
              cssFilesMap.set(nodePath, node.content);
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

    // Build dependency graph for all JS/JSX/TS/TSX files
    const allFiles = [...jsxFiles, ...jsFiles];
    const currentDependencyGraph = buildDependencyGraph(allFiles);
    const currentFileList = allFiles.map((f) => f.name).sort();

    // Check if dependencies changed (files added/deleted/imports changed)
    let requiresFullReload = false;
    if (bundleCache) {
      if (
        dependencyGraphChanged(
          bundleCache.dependencyGraph,
          currentDependencyGraph
        )
      ) {
        console.log("[Bundler] 🔄 Dependencies changed - full reload required");
        requiresFullReload = true;
      }
    }

    // Track which CSS files are actually imported
    const importedCssContents = new Set<string>();
    const jsAndJsxFiles = [...jsxFiles, ...jsFiles];

    // Scan all JS/JSX files for CSS imports (excluding commented lines)
    jsAndJsxFiles.forEach((file) => {
      // Split content by lines to check for comments
      const lines = file.content.split("\n");

      lines.forEach((line) => {
        // Skip commented lines (single-line comments)
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("//")) {
          return;
        }

        // Check for CSS import in this line
        const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/;
        const match = cssImportRegex.exec(line);

        if (match) {
          const cssPath = match[1];

          // Resolve the CSS path relative to the importing file
          const fileDir = file.name.includes("/")
            ? file.name.substring(0, file.name.lastIndexOf("/"))
            : "";

          // Handle different import patterns: './styles.css', '../styles.css', 'styles.css'
          let resolvedPath = cssPath;
          if (cssPath.startsWith("./")) {
            resolvedPath = fileDir
              ? `${fileDir}/${cssPath.slice(2)}`
              : cssPath.slice(2);
          } else if (cssPath.startsWith("../")) {
            // Handle parent directory imports
            const pathParts = fileDir.split("/");
            let cssPathParts = cssPath.split("/");
            while (cssPathParts[0] === "..") {
              pathParts.pop();
              cssPathParts.shift();
            }
            resolvedPath = [...pathParts, ...cssPathParts].join("/");
          } else if (!cssPath.startsWith("/")) {
            // Relative path without ./ prefix
            resolvedPath = fileDir ? `${fileDir}/${cssPath}` : cssPath;
          }

          // Find the CSS file in our map and add its content to imported set
          const cssContent = cssFilesMap.get(resolvedPath);
          if (cssContent) {
            importedCssContents.add(cssContent);
          }
        }
      });
    });

    // Get the main HTML file or create a default one
    let baseHTML =
      htmlFiles[0] ||
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    // Combine only the CSS files that are actually imported
    const combinedCSS = Array.from(importedCssContents).join("\n\n");

    // Add HMR transition CSS to minimize perceived flicker
    const hmrTransitionCSS = `
/* HMR Transition: Zero-flicker updates */
#root {
  min-height: 100vh;
  position: relative;
}

/* When root is being updated, maintain content to prevent flash */
#root:empty {
  opacity: 1;
  background-color: inherit;
}

/* Hide old roots during cleanup (prevents seeing duplicates) */
#root > *:not(:last-child) {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

/* Ensure new content is visible */
#root > *:last-child {
  position: relative;
  opacity: 1;
  z-index: 1;
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

    // allFiles already defined above for dependency graph tracking
    // const allFiles = [...jsxFiles, ...jsFiles]; // REMOVED - using existing allFiles

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
  // console.log('[Iframe] 🎧 HMR listener installed and ready');

  // Store the React root to avoid recreating it
  let reactRoot = null;
  let currentModuleRevision = 0;
  let isUpdating = false;

  window.addEventListener('message', (event) => {
    if (event.data.type === 'hot-module-reload') {
      // Prevent overlapping updates
      if (isUpdating) {
        // console.log('[Iframe] ⏸️ Update already in progress, skipping...');
        return;
      }

      const revisionId = ++currentModuleRevision;
      isUpdating = true;

      // console.log('[Iframe] 📨 Received HMR update:', {
      //   revision: revisionId,
      //   codeLength: event.data.code?.length,
      //   cssLength: event.data.css?.length
      // });

      try {
        const newCode = event.data.code;
        const newCSS = event.data.css || '';

        // Update CSS first (before DOM changes to prevent FOUC)
        if (newCSS) {
          // console.log('[Iframe] 🎨 Updating CSS...');
          let styleTag = document.getElementById('app-styles');
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'app-styles';
            document.head.appendChild(styleTag);
          }
          styleTag.textContent = newCSS;
        }

        // console.log('[Iframe] 🚀 Executing new module code...');

        const root = document.getElementById('root');
        if (!root) {
          console.error('[Iframe] ❌ Root element not found');
          isUpdating = false;
          return;
        }

        // DON'T clear innerHTML - let React handle the transition
        // This prevents the blank screen flash

        // Inject code as a new <script type="module"> tag
        // This works with CSP 'unsafe-inline' and supports ES6 imports
        try {
          // Remove any existing HMR script tags
          const oldScripts = document.querySelectorAll('script[data-hmr="true"]');
          oldScripts.forEach(script => script.remove());

          // Create new script tag with the updated code
          const script = document.createElement('script');
          script.type = 'module';
          script.setAttribute('data-hmr', 'true');
          script.textContent = newCode;

          // Append to document head
          document.head.appendChild(script);

          // console.log('[Iframe] ✅ HMR update complete - NO NETWORK REQUESTS, NO FLICKER, CSP-SAFE');
          isUpdating = false;

          // Clean up old React roots if there are duplicates
          setTimeout(() => {
            const rootChildren = root.children;
            if (rootChildren.length > 1) {
              // console.log('[Iframe] 🧹 Cleaning up', rootChildren.length - 1, 'duplicate roots');
              // Remove all but the last child (newest render)
              while (rootChildren.length > 1) {
                root.removeChild(rootChildren[0]);
              }
            }
          }, 100);
        } catch (error) {
          console.error('[Iframe] ❌ Hot module reload failed:', error);
          // On error, clear and let next update try again
          root.innerHTML = '';
          isUpdating = false;
        }
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

    // 1. Inject import map
    if (importMap && finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${importMap}\n</head>`);
    }

    // 2. Inject Emotion polyfill (must come before any module code)
    if (finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${emotionPolyfill}\n</head>`);
    }

    // 3. Inject CSS (includes HMR transition CSS)
    // IMPORTANT: Use id="app-styles" so HMR can update the same style tag
    if (fullCSS) {
      const styleTag = `<style id="app-styles">\n${fullCSS}\n</style>`;
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

    const result: BundleResult = {
      html: finalHTML,
      requiresFullReload,
      fileList: currentFileList,
      dependencyGraph: currentDependencyGraph,
    };

    // Update cache
    bundleCache = {
      filesHash,
      fileList: currentFileList,
      dependencyGraph: currentDependencyGraph,
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
