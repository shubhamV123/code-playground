export const OPEN_NPM_ENV_FLAG = "VITE_ENABLE_OPEN_NPM";
export const DEMO_PACKAGE_LIMIT = 8;
export const INSTALL_BATCH_LIMIT = 6;
export const PREVIEW_MESSAGE_CHANNEL = "code-playground-preview-v1";
export const PUBLIC_DEMO_NOTICE =
  "Public demo is restricted. Clone the repo and set VITE_ENABLE_OPEN_NPM=true to experiment with arbitrary npm packages locally.";

export interface EnvLike {
  [key: string]: string | boolean | undefined;
}

export interface PublicDemoPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
}

export interface PolicyValidationResult {
  ok: boolean;
  reason?: string;
}

interface PackageSearchResult {
  package: {
    name: string;
    version: string;
    description: string;
    keywords?: string[];
    date: string;
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export const PUBLIC_DEMO_PACKAGES: PublicDemoPackage[] = [
  {
    name: "react",
    version: "19.1.1",
    description: "React runtime used by the built-in React templates.",
    keywords: ["react", "ui", "template"],
  },
  {
    name: "react-dom",
    version: "19.1.1",
    description: "React DOM renderer used by the built-in React templates.",
    keywords: ["react", "dom", "template"],
  },
  {
    name: "vue",
    version: "3.5.13",
    description: "Vue 3 runtime used by the built-in Vue template.",
    keywords: ["vue", "template"],
  },
  {
    name: "@mui/material",
    version: "7.3.4",
    description: "Material UI components for the built-in MUI template.",
    keywords: ["mui", "material", "react", "components"],
  },
  {
    name: "@emotion/react",
    version: "11.14.0",
    description: "Emotion React runtime required by the MUI template.",
    keywords: ["emotion", "mui", "react"],
  },
  {
    name: "@emotion/styled",
    version: "11.14.1",
    description: "Emotion styled API required by the MUI template.",
    keywords: ["emotion", "mui", "styled"],
  },
  {
    name: "react-icons",
    version: "5.5.0",
    description: "Icon components for small React demos.",
    keywords: ["icons", "react"],
  },
  {
    name: "zustand",
    version: "5.0.8",
    description: "Small state management library for local demos.",
    keywords: ["state", "react", "store"],
  },
];

const PUBLIC_DEMO_PACKAGE_MAP = new Map(
  PUBLIC_DEMO_PACKAGES.map((pkg) => [pkg.name, pkg])
);

const SAFE_PACKAGE_NAME =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const SAFE_VERSION = /^[a-zA-Z0-9.+~^*_>-]+$/;

export function isOpenNpmEnabled(env: EnvLike): boolean {
  return env[OPEN_NPM_ENV_FLAG] === "true" || env[OPEN_NPM_ENV_FLAG] === true;
}

export function normalizeVersion(version: string): string {
  return version.trim().replace(/^[v^~]/, "");
}

export function isSafePackageName(packageName: string): boolean {
  return (
    packageName.length > 0 &&
    packageName.length <= 214 &&
    SAFE_PACKAGE_NAME.test(packageName)
  );
}

function isSafeVersion(version: string): boolean {
  return version.length > 0 && version.length <= 128 && SAFE_VERSION.test(version);
}

export function isPublicDemoPackage(packageName: string): boolean {
  return PUBLIC_DEMO_PACKAGE_MAP.has(packageName);
}

export function getPublicDemoPackage(
  packageName: string
): PublicDemoPackage | undefined {
  return PUBLIC_DEMO_PACKAGE_MAP.get(packageName);
}

export function validatePackageInstall({
  packageName,
  version,
  installedPackages,
  openNpmEnabled,
}: {
  packageName: string;
  version: string;
  installedPackages: Record<string, string>;
  openNpmEnabled: boolean;
}): PolicyValidationResult {
  if (!isSafePackageName(packageName)) {
    return {
      ok: false,
      reason: `Invalid package name: ${packageName}`,
    };
  }

  if (!isSafeVersion(version)) {
    return {
      ok: false,
      reason: `Invalid package version for ${packageName}`,
    };
  }

  const isNewPackage = !installedPackages[packageName];
  if (
    isNewPackage &&
    Object.keys(installedPackages).length >= DEMO_PACKAGE_LIMIT
  ) {
    return {
      ok: false,
      reason: `This demo has a package limit of ${DEMO_PACKAGE_LIMIT}. Clone the repo to experiment with more dependencies locally.`,
    };
  }

  if (openNpmEnabled) {
    return { ok: true };
  }

  const allowedPackage = getPublicDemoPackage(packageName);
  if (!allowedPackage) {
    return {
      ok: false,
      reason: `${packageName} is not available in the public demo. Clone the repo to use arbitrary npm packages locally.`,
    };
  }

  if (normalizeVersion(version) !== allowedPackage.version) {
    return {
      ok: false,
      reason: `${packageName}@${version} is not available in the public demo. The curated demo version is ${allowedPackage.version}.`,
    };
  }

  return { ok: true };
}

export function validatePackageBatch({
  packages,
  installedPackages,
  openNpmEnabled,
}: {
  packages: Record<string, string>;
  installedPackages: Record<string, string>;
  openNpmEnabled: boolean;
}): PolicyValidationResult {
  const packageEntries = Object.entries(packages);

  if (packageEntries.length > INSTALL_BATCH_LIMIT) {
    return {
      ok: false,
      reason: `This demo can install at most ${INSTALL_BATCH_LIMIT} packages at once.`,
    };
  }

  const newPackageCount = packageEntries.filter(
    ([packageName]) => !installedPackages[packageName]
  ).length;
  if (
    Object.keys(installedPackages).length + newPackageCount >
    DEMO_PACKAGE_LIMIT
  ) {
    return {
      ok: false,
      reason: `This demo has a package limit of ${DEMO_PACKAGE_LIMIT}. Clone the repo to experiment with more dependencies locally.`,
    };
  }

  for (const [packageName, version] of packageEntries) {
    const result = validatePackageInstall({
      packageName,
      version: normalizeVersion(version),
      installedPackages,
      openNpmEnabled,
    });
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

export function getBlockedPublicDemoPackages({
  packageVersions,
  externalPackages,
  openNpmEnabled,
}: {
  packageVersions: Record<string, string>;
  externalPackages: Set<string>;
  openNpmEnabled: boolean;
}): string[] {
  if (openNpmEnabled) {
    return [];
  }

  const referencedPackages = new Set([
    ...Object.keys(packageVersions),
    ...externalPackages,
  ]);

  return Array.from(referencedPackages)
    .filter((packageName) => !isPublicDemoPackage(packageName))
    .sort();
}

export function searchPublicDemoPackages(
  query: string
): PackageSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return PUBLIC_DEMO_PACKAGES.filter((pkg) => {
    const searchable = [
      pkg.name,
      pkg.description,
      ...pkg.keywords,
    ].join(" ");
    return searchable.toLowerCase().includes(normalizedQuery);
  }).map((pkg, index) => ({
    package: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      keywords: pkg.keywords,
      date: "2026-07-04T00:00:00.000Z",
    },
    score: {
      final: 1 - index * 0.01,
      detail: {
        quality: 1,
        popularity: 1,
        maintenance: 1,
      },
    },
  }));
}
