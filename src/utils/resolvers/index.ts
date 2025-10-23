import { baseResolver } from "./baseResolver";
import { muiResolver } from "./muiResolver";
import { vueResolver } from "./vueResolver";
import { svelteResolver } from "./svelteResolver";

export type { ResolverResult } from "./baseResolver";

/**
 * Resolver factory
 * Detects which resolver to use based on installed packages
 */
export function getResolver(packageVersions: Record<string, string>) {
  const packages = Object.keys(packageVersions);

  // Check for Vue
  if (packages.includes('vue')) {
    return vueResolver;
  }

  // Check for Svelte
  if (packages.includes('svelte')) {
    return svelteResolver;
  }

  // Check if MUI or Emotion is installed
  const hasMui = packages.some((pkg) =>
    pkg.includes('@mui') || pkg.includes('@emotion')
  );

  // Return appropriate resolver
  return hasMui ? muiResolver : baseResolver;
}
