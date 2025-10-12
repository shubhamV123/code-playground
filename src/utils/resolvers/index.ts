import { baseResolver } from "./baseResolver";
import { muiResolver } from "./muiResolver";

export type { ResolverResult } from "./baseResolver";

/**
 * Resolver factory
 * Detects which resolver to use based on installed packages
 */
export function getResolver(packageVersions: Record<string, string>) {
  // Check if MUI or Emotion is installed
  const hasMui = Object.keys(packageVersions).some((pkg) =>
    pkg.includes('@mui') || pkg.includes('@emotion')
  );

  // Return appropriate resolver
  return hasMui ? muiResolver : baseResolver;
}
