/**
 * Svelte resolver for Svelte applications
 * Uses esm.sh with proper Svelte runtime
 */

export interface ResolverResult {
  imports: Record<string, string>;
}

export function svelteResolver(
  packageVersions: Record<string, string>,
  externalPackages: Set<string>
): ResolverResult {
  const imports: Record<string, string> = {};

  const svelteVersion = packageVersions['svelte']?.replace(/^\^/, '');

  // Add Svelte
  if (svelteVersion) {
    imports['svelte'] = `https://esm.sh/svelte@${svelteVersion}`;
    // Add Svelte subpaths (store, animate, etc.)
    imports['svelte/'] = `https://esm.sh/svelte@${svelteVersion}/`;
  }

  // Add all other packages
  externalPackages.forEach((pkg) => {
    // Skip svelte as it's already added
    if (pkg === 'svelte') {
      return;
    }

    const version = packageVersions[pkg];
    const versionStr = version?.replace(/^\^/, '') || '';

    // For Svelte ecosystem packages, add external parameter
    let packageUrl: string;
    if (svelteVersion && pkg.startsWith('@svelte')) {
      // Svelte ecosystem packages should use external Svelte
      packageUrl = versionStr
        ? `https://esm.sh/${pkg}@${versionStr}?external=svelte`
        : `https://esm.sh/${pkg}?external=svelte`;
    } else {
      // Standard packages
      packageUrl = versionStr
        ? `https://esm.sh/${pkg}@${versionStr}`
        : `https://esm.sh/${pkg}`;
    }

    imports[pkg] = packageUrl;

    // Add subpath mapping with trailing slash
    imports[`${pkg}/`] = `${packageUrl}/`;
  });

  return { imports };
}
