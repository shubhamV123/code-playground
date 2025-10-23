/**
 * Vue resolver for Vue 3 applications
 * Uses esm.sh with proper Vue runtime compiler build
 */

export interface ResolverResult {
  imports: Record<string, string>;
}

export function vueResolver(
  packageVersions: Record<string, string>,
  externalPackages: Set<string>
): ResolverResult {
  const imports: Record<string, string> = {};

  const vueVersion = packageVersions['vue']?.replace(/^\^/, '');

  // Add Vue with runtime compiler (for template string support)
  if (vueVersion) {
    imports['vue'] = `https://esm.sh/vue@${vueVersion}`;
    // Add common Vue subpaths
    imports['vue/'] = `https://esm.sh/vue@${vueVersion}/`;
  }

  // Add all other packages
  externalPackages.forEach((pkg) => {
    // Skip vue as it's already added
    if (pkg === 'vue') {
      return;
    }

    const version = packageVersions[pkg];
    const versionStr = version?.replace(/^\^/, '') || '';

    // For Vue ecosystem packages, add external parameter to use shared Vue
    let packageUrl: string;
    if (vueVersion && (pkg.startsWith('@vue/') || pkg.startsWith('vue-'))) {
      // Vue ecosystem packages should use external Vue
      packageUrl = versionStr
        ? `https://esm.sh/${pkg}@${versionStr}?external=vue`
        : `https://esm.sh/${pkg}?external=vue`;
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
