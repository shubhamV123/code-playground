/**
 * Base resolver for standard React applications
 * Uses esm.sh without special external handling
 */

export interface ResolverResult {
  imports: Record<string, string>;
}

export function baseResolver(
  packageVersions: Record<string, string>,
  externalPackages: Set<string>
): ResolverResult {
  const imports: Record<string, string> = {};

  const reactVersion = packageVersions['react']?.replace(/^\^/, '');
  const reactDomVersion = packageVersions['react-dom']?.replace(/^\^/, '');

  // Add React and React-DOM
  if (reactVersion) {
    imports['react'] = `https://esm.sh/react@${reactVersion}`;
    imports['react/jsx-runtime'] = `https://esm.sh/react@${reactVersion}/jsx-runtime`;
    imports['react/jsx-dev-runtime'] = `https://esm.sh/react@${reactVersion}/jsx-dev-runtime`;
  }
  if (reactDomVersion) {
    imports['react-dom'] = `https://esm.sh/react-dom@${reactDomVersion}`;
    imports['react-dom/client'] = `https://esm.sh/react-dom@${reactDomVersion}/client`;
  }

  // Add all other packages
  externalPackages.forEach((pkg) => {
    // Skip react and react-dom as they're already added
    if (pkg === 'react' || pkg === 'react-dom') {
      return;
    }

    const version = packageVersions[pkg];
    const versionStr = version?.replace(/^\^/, '') || '';

    // Add ?external=react,react-dom to prevent multiple React instances
    // This ensures all packages use the same React from the import map
    let packageUrl: string;
    if (reactVersion && reactDomVersion) {
      // If React is installed, add external parameter
      packageUrl = versionStr
        ? `https://esm.sh/${pkg}@${versionStr}?external=react,react-dom`
        : `https://esm.sh/${pkg}?external=react,react-dom`;
    } else {
      // No React installed, use standard URL
      packageUrl = versionStr
        ? `https://esm.sh/${pkg}@${versionStr}`
        : `https://esm.sh/${pkg}`;
    }

    imports[pkg] = packageUrl;

    // Add subpath mapping with trailing slash to support imports like '@pkg/name/subpath'
    imports[`${pkg}/`] = `${packageUrl}/`;
  });

  return { imports };
}
