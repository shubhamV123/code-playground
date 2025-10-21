/**
 * MUI-specific resolver
 * Uses ?external=react,react-dom to ensure single React instance
 * This prevents the "Cannot read properties of null (reading 'useContext')" error
 */

export interface ResolverResult {
  imports: Record<string, string>;
}

export function muiResolver(
  packageVersions: Record<string, string>,
  externalPackages: Set<string>
): ResolverResult {
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

    // Add subpath mapping with trailing slash to support imports like '@pkg/name/subpath'
    imports[`${pkg}/`] = `${packageUrl}/`;

    // NO wildcards needed - we use named imports from main package
    // e.g., import { Button } from '@mui/material' instead of import Button from '@mui/material/Button'
  });

  // Emotion JSX runtime (also needs external param)
  const emotionReactVersion = packageVersions['@emotion/react']?.replace(/^\^/, '');
  if (emotionReactVersion) {
    imports['@emotion/react/jsx-runtime'] = `https://esm.sh/@emotion/react@${emotionReactVersion}/jsx-runtime?external=react,react-dom`;
    imports['@emotion/react/jsx-dev-runtime'] = `https://esm.sh/@emotion/react@${emotionReactVersion}/jsx-dev-runtime?external=react,react-dom`;
  }

  return { imports };
}
