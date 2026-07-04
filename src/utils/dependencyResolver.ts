import {
  getPublicDemoPackage,
  isOpenNpmEnabled,
  isSafePackageName,
  normalizeVersion,
  validatePackageBatch,
  validatePackageInstall,
} from "../config/securityPolicy";

/**
 * Dependency Resolver - Automatically resolves and installs peer dependencies
 * Handles complex dependency graphs like Material UI + Emotion
 */

export interface PackageMetadata {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export interface ResolvedPackage {
  name: string;
  version: string;
  reason: 'direct' | 'peer' | 'dependency';
  optional?: boolean;
}

export interface DependencyResolutionResult {
  packages: ResolvedPackage[];
  warnings: string[];
  errors: string[];
}

/**
 * Fetches package metadata from NPM registry
 */
export async function fetchPackageMetadata(
  packageName: string,
  version?: string
): Promise<PackageMetadata | null> {
  const openNpmEnabled = isOpenNpmEnabled(import.meta.env);
  const publicDemoPackage = getPublicDemoPackage(packageName);
  const effectiveVersion = version || (!openNpmEnabled ? publicDemoPackage?.version : "") || "";

  const policyResult =
    openNpmEnabled && !effectiveVersion
      ? {
          ok: isSafePackageName(packageName),
          reason: `Invalid package name: ${packageName}`,
        }
      : validatePackageInstall({
          packageName,
          version: effectiveVersion,
          installedPackages: {},
          openNpmEnabled,
        });

  if (!policyResult.ok) {
    console.warn(policyResult.reason);
    return null;
  }

  try {
    const url = effectiveVersion
      ? `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(effectiveVersion)}`
      : `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch package metadata: ${response.statusText}`);
    }

    const data = await response.json();

    // If no version specified, get the latest version
    if (!version) {
      const latestVersion = data['dist-tags']?.latest;
      if (!latestVersion || !data.versions?.[latestVersion]) {
        throw new Error('Failed to determine latest version');
      }
      return data.versions[latestVersion];
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch metadata for ${packageName}:`, error);
    return null;
  }
}

/**
 * Checks if a version satisfies a semver range (simplified)
 */
function satisfiesRange(version: string, range: string): boolean {
  const cleanVersion = version.replace(/^[v^~]/, '');

  // Handle OR ranges (e.g., "^17.0.0 || ^18.0.0 || ^19.0.0")
  if (range.includes('||')) {
    const ranges = range.split('||').map(r => r.trim());
    return ranges.some(r => satisfiesRange(cleanVersion, r));
  }

  const cleanRange = range.replace(/^[~^]/, '');

  // Extract version parts
  const [vMajor, vMinor = '0', vPatch = '0'] = cleanVersion.split('.').map(v => parseInt(v));
  const [rMajor, rMinor = '0', rPatch = '0'] = cleanRange.split('.').map(v => parseInt(v));

  // For ^ ranges, major version must match
  if (range.startsWith('^')) {
    if (vMajor !== rMajor) return false;
    if (vMinor > rMinor) return true;
    if (vMinor === rMinor && vPatch >= rPatch) return true;
    return false;
  }

  // For ~ ranges, major and minor must match
  if (range.startsWith('~')) {
    return vMajor === rMajor && vMinor === rMinor && vPatch >= rPatch;
  }

  // For >= ranges
  if (range.startsWith('>=')) {
    if (vMajor > rMajor) return true;
    if (vMajor === rMajor && vMinor > rMinor) return true;
    if (vMajor === rMajor && vMinor === rMinor && vPatch >= rPatch) return true;
    return false;
  }

  // Default: exact match or greater
  return cleanVersion >= cleanRange;
}

/**
 * Resolves all dependencies including peer dependencies recursively
 */
export async function resolveDependencies(
  packageName: string,
  version: string,
  installedPackages: Record<string, string> = {},
  depth = 0,
  maxDepth = 3
): Promise<DependencyResolutionResult> {
  const result: DependencyResolutionResult = {
    packages: [],
    warnings: [],
    errors: [],
  };

  const openNpmEnabled = isOpenNpmEnabled(import.meta.env);
  const policyResult = validatePackageInstall({
    packageName,
    version,
    installedPackages,
    openNpmEnabled,
  });

  if (!policyResult.ok) {
    result.errors.push(policyResult.reason || `Blocked ${packageName}@${version}`);
    return result;
  }

  // Prevent infinite recursion
  if (depth > maxDepth) {
    result.warnings.push(
      `Maximum dependency depth (${maxDepth}) reached for ${packageName}`
    );
    return result;
  }

  // Fetch package metadata
  const metadata = await fetchPackageMetadata(packageName, version);

  if (!metadata) {
    result.errors.push(`Failed to fetch metadata for ${packageName}@${version}`);
    return result;
  }

  // Add the main package
  result.packages.push({
    name: packageName,
    version: metadata.version,
    reason: depth === 0 ? 'direct' : 'dependency',
  });

  // Resolve peer dependencies
  if (metadata.peerDependencies) {
    for (const [peerName, peerRange] of Object.entries(
      metadata.peerDependencies
    )) {
      const isOptional =
        metadata.peerDependenciesMeta?.[peerName]?.optional || false;

      // SKIP type definitions and build tools - they're not needed in browser
      if (peerName.startsWith('@types/') ||
          peerName.includes('babel') ||
          peerName.includes('webpack') ||
          peerName.includes('typescript') ||
          peerName.includes('pigment-css')) {
        continue;
      }

      // Check if already installed with compatible version
      const installedVersion = installedPackages[peerName];
      if (installedVersion) {
        if (satisfiesRange(installedVersion, peerRange)) {
          // Already installed with compatible version
          continue;
        } else {
          // Don't warn if version actually satisfies (our check might be imperfect)
          if (!peerRange.includes('||') || !satisfiesRange(installedVersion, peerRange)) {
            result.warnings.push(
              `${peerName}@${installedVersion} installed (${packageName} requires: ${peerRange})`
            );
          }
          continue;
        }
      }

      // Fetch the peer dependency metadata - use LATEST version for better compatibility
      // Don't parse the range, let NPM give us the latest compatible version
      const peerMetadata = await fetchPackageMetadata(peerName);

      if (!peerMetadata) {
        if (!isOptional) {
          result.errors.push(
            `Failed to resolve required peer dependency ${peerName}@${peerRange}`
          );
        } else {
          result.warnings.push(
            `Optional peer dependency ${peerName}@${peerRange} could not be resolved`
          );
        }
        continue;
      }

      // Add the peer dependency
      result.packages.push({
        name: peerName,
        version: peerMetadata.version,
        reason: 'peer',
        optional: isOptional,
      });

      // Recursively resolve peer dependencies of peer dependencies
      // This is critical for Material UI (Emotion has its own peer deps)
      if (peerMetadata.peerDependencies && depth < maxDepth) {
        const nestedResult = await resolveDependencies(
          peerName,
          peerMetadata.version,
          {
            ...installedPackages,
            [packageName]: metadata.version,
            [peerName]: peerMetadata.version,
          },
          depth + 1,
          maxDepth
        );

        // Merge nested results (skip the main package as it's already added)
        result.packages.push(...nestedResult.packages.slice(1));
        result.warnings.push(...nestedResult.warnings);
        result.errors.push(...nestedResult.errors);
      }
    }
  }

  return result;
}

/**
 * Deduplicates resolved packages, keeping the highest compatible version
 */
export function deduplicatePackages(
  packages: ResolvedPackage[]
): ResolvedPackage[] {
  const packageMap = new Map<string, ResolvedPackage>();

  for (const pkg of packages) {
    const existing = packageMap.get(pkg.name);

    if (!existing) {
      packageMap.set(pkg.name, pkg);
      continue;
    }

    // Keep the higher version or prioritize direct/peer over dependency
    const existingVersion = existing.version.replace(/^v/, '');
    const newVersion = pkg.version.replace(/^v/, '');

    if (pkg.reason === 'direct' || existingVersion < newVersion) {
      packageMap.set(pkg.name, pkg);
    }
  }

  return Array.from(packageMap.values());
}

/**
 * Main function to resolve and prepare packages for installation
 */
export async function resolveAndPrepareInstallation(
  packageName: string,
  version: string,
  currentlyInstalled: Record<string, string>
): Promise<{
  toInstall: Record<string, string>;
  warnings: string[];
  errors: string[];
  summary: string;
}> {
  const openNpmEnabled = isOpenNpmEnabled(import.meta.env);

  // Resolve dependencies
  const resolution = await resolveDependencies(
    packageName,
    version,
    currentlyInstalled
  );

  if (resolution.errors.length > 0) {
    return {
      toInstall: {},
      warnings: resolution.warnings,
      errors: resolution.errors,
      summary: `Failed to resolve dependencies: ${resolution.errors.join(', ')}`,
    };
  }

  // Deduplicate packages
  const deduplicated = deduplicatePackages(resolution.packages);

  // Filter out already installed packages with same version
  const toInstall: Record<string, string> = {};
  const skipped: string[] = [];

  for (const pkg of deduplicated) {
    const installedVersion = currentlyInstalled[pkg.name];
    if (installedVersion === pkg.version) {
      skipped.push(pkg.name);
    } else {
      toInstall[pkg.name] = pkg.version;
    }
  }

  // HACK: MUI-specific fix - add react-is to match React version (per MUI docs)
  // This prevents runtime errors with React 18/19
  if (packageName.includes('@mui') || Object.keys(toInstall).some(pkg => pkg.includes('@mui'))) {
    const reactVersion = currentlyInstalled['react'] || toInstall['react'];
    if (reactVersion && !currentlyInstalled['react-is']) {
      // Match react-is version to React version
      const cleanVersion = reactVersion.replace(/^\^/, '');
      toInstall['react-is'] = cleanVersion;
      resolution.warnings.push(
        'Added react-is to match React version (required by Material UI)'
      );
    }
  }

  const batchValidation = validatePackageBatch({
    packages: Object.fromEntries(
      Object.entries(toInstall).map(([name, version]) => [
        name,
        normalizeVersion(version),
      ])
    ),
    installedPackages: currentlyInstalled,
    openNpmEnabled,
  });

  if (!batchValidation.ok) {
    return {
      toInstall: {},
      warnings: resolution.warnings,
      errors: [batchValidation.reason || 'Package install blocked by demo policy'],
      summary: batchValidation.reason || 'Package install blocked by demo policy',
    };
  }

  // Build summary
  const newPackages = deduplicated.filter(
    (pkg) => !currentlyInstalled[pkg.name]
  );
  const peerPackages = newPackages.filter((pkg) => pkg.reason === 'peer');

  let summary = `Installing ${packageName}@${version}`;
  if (peerPackages.length > 0) {
    summary += ` with ${peerPackages.length} peer ${
      peerPackages.length === 1 ? 'dependency' : 'dependencies'
    }: ${peerPackages.map((p) => p.name).join(', ')}`;
  }

  return {
    toInstall,
    warnings: resolution.warnings,
    errors: resolution.errors,
    summary,
  };
}
