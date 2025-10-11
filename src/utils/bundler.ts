import * as esbuild from 'esbuild-wasm';
import { type FileNode } from "../types/fileSystem";

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

/**
 * Initialize esbuild-wasm (call once)
 */
export async function initializeBundler() {
  if (!esbuildInitialized) {
    try {
      await esbuild.initialize({
        wasmURL: '/esbuild.wasm',
      });
      esbuildInitialized = true;
    } catch (error) {
      console.error('Failed to initialize esbuild:', error);
      throw error;
    }
  }
}

/**
 * Bundles all files into a single HTML document for preview
 */
export async function bundleFiles(files: Record<string, FileNode>): Promise<BundleResult> {
  try {
    // Initialize esbuild if not already done
    await initializeBundler();

    // Extract files by type
    const htmlFiles: string[] = [];
    const cssFiles: string[] = [];
    const jsxFiles: FileWithContent[] = [];
    const jsFiles: FileWithContent[] = [];

    // Recursively collect files
    const collectFiles = (nodes: Record<string, FileNode>, currentPath = '') => {
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
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    // Combine all CSS
    const combinedCSS = cssFiles.join("\n\n");

    // Find entry point (index.js or index.jsx)
    const entryFile = [...jsFiles, ...jsxFiles].find(f =>
      f.name === 'src/index.js' || f.name === 'src/index.jsx' ||
      f.name === 'index.js' || f.name === 'index.jsx'
    );

    if (!entryFile) {
      return {
        html: baseHTML,
        error: 'No entry point found (index.js or index.jsx)',
      };
    }

    // Create a virtual file system for esbuild
    const allFiles = [...jsxFiles, ...jsFiles];

    // Read package.json FIRST to get installed dependencies
    const packageJsonNode = files['package.json'];
    let packageVersions: Record<string, string> = {};

    if (packageJsonNode && packageJsonNode.type === 'file' && packageJsonNode.content) {
      try {
        const packageJson = JSON.parse(packageJsonNode.content);
        packageVersions = packageJson.dependencies || {};
      } catch (error) {
        console.error('Failed to parse package.json:', error);
      }
    }

    // Helper to detect if file contains JSX
    const containsJSX = (content: string) => {
      return /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(content) || /<[a-z]+[\s/>]/.test(content);
    };

    // Determine loader for entry file
    const getLoader = (file: FileWithContent): 'jsx' | 'tsx' | 'ts' | 'js' => {
      if (file.ext === 'tsx' || file.ext === 'jsx') return 'jsx';
      if (file.ext === 'ts') return 'ts';
      // Check if JS file contains JSX
      if (file.ext === 'js' && containsJSX(file.content)) return 'jsx';
      return 'js';
    };

    // Check if Material UI or Emotion is used
    const usesMui = Object.keys(packageVersions).some(pkg =>
      pkg.includes('@mui') || pkg.includes('@emotion')
    );

    // Build with esbuild
    const result = await esbuild.build({
      stdin: {
        contents: entryFile.content,
        resolveDir: '/',
        sourcefile: entryFile.name,
        loader: getLoader(entryFile),
      },
      bundle: true,
      write: false,
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: usesMui ? '@emotion/react' : 'react',
      plugins: [
        {
          name: 'virtual-fs',
          setup(build) {
            // Handle CSS imports first - mark them as external (we inject CSS separately)
            build.onResolve({ filter: /\.css$/ }, () => {
              return {
                path: '__css__',
                namespace: 'css-stub',
                external: false,
              };
            });

            // Provide empty module for CSS imports
            build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => {
              return {
                contents: '// CSS is injected separately',
                loader: 'js',
              };
            });

            // Resolve local imports
            build.onResolve({ filter: /^\./ }, (args) => {
              const path = args.path.startsWith('./') ? args.path.slice(2) : args.path;

              // Try to find the file with various extensions
              const possiblePaths = [
                path,
                `${path}.js`,
                `${path}.jsx`,
                `${path}.ts`,
                `${path}.tsx`,
              ];

              for (const testPath of possiblePaths) {
                const file = allFiles.find(f =>
                  f.name === testPath ||
                  f.name === `src/${testPath}` ||
                  f.name.endsWith(`/${testPath}`)
                );
                if (file) {
                  return { path: file.name, namespace: 'virtual' };
                }
              }

              return { path, external: true };
            });

            // Load virtual files
            build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
              const file = allFiles.find(f => f.name === args.path);
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
              if (!args.path.startsWith('/')) {
                return { path: args.path, external: true };
              }
              return null;
            });
          },
        },
      ],
    });

    let bundledJS = '';
    if (result.outputFiles && result.outputFiles.length > 0) {
      bundledJS = new TextDecoder().decode(result.outputFiles[0].contents);
    }

    // Build import map for external dependencies
    const externalPackages = new Set<string>();

    // Add all dependencies from package.json
    Object.keys(packageVersions).forEach(pkg => {
      externalPackages.add(pkg);
    });

    // Extract imports from all files
    const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    allFiles.forEach(file => {
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const pkg = match[1];
        if (!pkg.startsWith('.') && !pkg.startsWith('/') && !pkg.endsWith('.css')) {
          // For scoped packages like @mui/material, use the full scope
          // For regular packages, use just the base name
          if (pkg.startsWith('@')) {
            // Get @scope/package (e.g., @mui/material from @mui/material/Button)
            const parts = pkg.split('/');
            if (parts.length >= 2) {
              const scopedPkg = `${parts[0]}/${parts[1]}`;
              externalPackages.add(scopedPkg);
            }
          } else {
            const basePkg = pkg.split('/')[0];
            externalPackages.add(basePkg);
          }
        }
      }
    });

    // Always include React for JSX files
    if (jsxFiles.length > 0) {
      externalPackages.add('react');
      externalPackages.add('react-dom');
    }

    // Build import map using esm.sh with proper external handling
    // This ensures single React instance by telling esm.sh NOT to bundle React separately
    const imports: Record<string, string> = {};

    const reactVersion = packageVersions['react']?.replace(/^\^/, '');
    const reactDomVersion = packageVersions['react-dom']?.replace(/^\^/, '');

    // First, add React and React-DOM WITHOUT external params (they are the base)
    if (reactVersion) {
      imports['react'] = `https://esm.sh/react@${reactVersion}`;
      imports['react/jsx-runtime'] = `https://esm.sh/react@${reactVersion}/jsx-runtime`;
      imports['react/jsx-dev-runtime'] = `https://esm.sh/react@${reactVersion}/jsx-dev-runtime`;
    }
    if (reactDomVersion) {
      imports['react-dom'] = `https://esm.sh/react-dom@${reactDomVersion}`;
      imports['react-dom/client'] = `https://esm.sh/react-dom@${reactDomVersion}/client`;
    }

    // Now add all OTHER packages WITH ?external=react,react-dom parameter
    // This tells esm.sh to use the React from the import map, not bundle its own
    externalPackages.forEach((pkg) => {
      // Skip react and react-dom as they're already added
      if (pkg === 'react' || pkg === 'react-dom') {
        return;
      }

      const version = packageVersions[pkg];
      const versionStr = version?.replace(/^\^/, '') || '';

      // For packages that depend on React, add external parameter
      let packageUrl: string;
      if (versionStr) {
        packageUrl = `https://esm.sh/${pkg}@${versionStr}?external=react,react-dom`;
      } else {
        packageUrl = `https://esm.sh/${pkg}?external=react,react-dom`;
      }

      imports[pkg] = packageUrl;

      // NO wildcards needed - we use named imports from main package
      // e.g., import { Button } from '@mui/material' instead of import Button from '@mui/material/Button'
    });

    // Emotion JSX runtime (also needs external param)
    const emotionReactVersion = packageVersions['@emotion/react']?.replace(/^\^/, '');
    if (emotionReactVersion) {
      imports['@emotion/react/jsx-runtime'] = `https://esm.sh/@emotion/react@${emotionReactVersion}/jsx-runtime?external=react,react-dom`;
      imports['@emotion/react/jsx-dev-runtime'] = `https://esm.sh/@emotion/react@${emotionReactVersion}/jsx-dev-runtime?external=react,react-dom`;
    }

    const importMap = Object.keys(imports).length > 0 ? `
<script type="importmap">
${JSON.stringify({ imports }, null, 2)}
</script>` : '';

    // Check if Emotion is being used
    const hasEmotion = Object.keys(externalPackages).some(pkg => pkg.includes('@emotion'));

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
${hasEmotion ? `
// CRITICAL: Ensure document.head is available for Emotion style injection
// Material UI v5+ uses Emotion which injects styles dynamically
if (typeof document !== 'undefined') {
  // Emotion will create its own cache and inject styles here
  // Just ensure the environment is ready
  console.log('[Emotion] Runtime environment ready for style injection');
  console.log('[Emotion] document.head available:', !!document.head);
}
` : ''}
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

    // 3. Inject CSS
    if (combinedCSS) {
      const styleTag = `<style>\n${combinedCSS}\n</style>`;
      if (finalHTML.includes("</head>")) {
        finalHTML = finalHTML.replace("</head>", `${styleTag}\n</head>`);
      } else {
        finalHTML = styleTag + "\n" + finalHTML;
      }
    }

    // 4. Inject console interceptor
    if (finalHTML.includes("</head>")) {
      finalHTML = finalHTML.replace("</head>", `${consoleInterceptor}\n</head>`);
    } else if (finalHTML.includes("<body>")) {
      finalHTML = finalHTML.replace("<body>", `<body>\n${consoleInterceptor}`);
    } else {
      finalHTML = consoleInterceptor + "\n" + finalHTML;
    }

    // 5. Inject bundled JS
    if (bundledJS) {
      const scriptTag = `<script type="module">\n${bundledJS}\n</script>`;
      if (finalHTML.includes("</body>")) {
        finalHTML = finalHTML.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        finalHTML = finalHTML + "\n" + scriptTag;
      }
    }

    return { html: finalHTML };
  } catch (error) {
    return {
      html: "",
      error: error instanceof Error ? error.message : "Unknown bundling error",
    };
  }
}
