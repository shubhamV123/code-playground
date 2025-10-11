export interface NpmPackage {
  name: string;
  version: string;
  description: string;
  keywords?: string[];
  author?: {
    name: string;
  };
  date: string;
}

export interface NpmSearchResult {
  package: NpmPackage;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export interface NpmSearchResponse {
  objects: NpmSearchResult[];
  total: number;
}

/**
 * Search NPM registry for packages
 */
export async function searchNpmPackages(query: string): Promise<NpmSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`
    );

    if (!response.ok) {
      throw new Error('Failed to search packages');
    }

    const data: NpmSearchResponse = await response.json();
    return data.objects;
  } catch (error) {
    console.error('NPM search error:', error);
    return [];
  }
}

/**
 * Get package information including all versions
 */
export async function getPackageInfo(packageName: string): Promise<{
  name: string;
  description: string;
  'dist-tags': { latest: string };
  versions: Record<string, any>;
} | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch package info');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get package info:', error);
    return null;
  }
}

/**
 * Get available versions for a package
 */
export async function getPackageVersions(packageName: string): Promise<string[]> {
  const info = await getPackageInfo(packageName);
  if (!info || !info.versions) {
    return [];
  }

  // Return versions in reverse order (newest first)
  return Object.keys(info.versions).reverse();
}
