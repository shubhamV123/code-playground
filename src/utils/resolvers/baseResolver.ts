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

    // Standard esm.sh URL
    const packageUrl: string = versionStr
      ? `https://esm.sh/${pkg}@${versionStr}`
      : `https://esm.sh/${pkg}`;

    imports[pkg] = packageUrl;
  });

  return { imports };
}
