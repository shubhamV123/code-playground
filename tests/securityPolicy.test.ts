import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEMO_PACKAGE_LIMIT,
  getBlockedPublicDemoPackages,
  isOpenNpmEnabled,
  searchPublicDemoPackages,
  validatePackageInstall,
} from "../src/config/securityPolicy.ts";

describe("security policy", () => {
  it("keeps open npm disabled unless the env flag is explicitly true", () => {
    assert.equal(isOpenNpmEnabled({}), false);
    assert.equal(isOpenNpmEnabled({ VITE_ENABLE_OPEN_NPM: "false" }), false);
    assert.equal(isOpenNpmEnabled({ VITE_ENABLE_OPEN_NPM: "true" }), true);
  });

  it("allows only curated packages in public demo mode", () => {
    const result = validatePackageInstall({
      packageName: "left-pad",
      version: "1.3.0",
      installedPackages: {},
      openNpmEnabled: false,
    });

    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /not available in the public demo/);
  });

  it("allows arbitrary safe package names only when open npm mode is enabled", () => {
    const result = validatePackageInstall({
      packageName: "left-pad",
      version: "1.3.0",
      installedPackages: {},
      openNpmEnabled: true,
    });

    assert.equal(result.ok, true);
  });

  it("rejects package names with unsafe characters", () => {
    const result = validatePackageInstall({
      packageName: "bad package",
      version: "1.0.0",
      installedPackages: {},
      openNpmEnabled: true,
    });

    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /Invalid package name/);
  });

  it("enforces a package count limit", () => {
    const installedPackages = Object.fromEntries(
      Array.from({ length: DEMO_PACKAGE_LIMIT }, (_, index) => [
        `pkg-${index}`,
        "1.0.0",
      ])
    );

    const result = validatePackageInstall({
      packageName: "react-icons",
      version: "5.5.0",
      installedPackages,
      openNpmEnabled: true,
    });

    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /package limit/);
  });

  it("blocks package.json edits that reference non-curated public demo packages", () => {
    const blocked = getBlockedPublicDemoPackages({
      packageVersions: { react: "19.1.1", "left-pad": "1.3.0" },
      externalPackages: new Set(["react", "left-pad"]),
      openNpmEnabled: false,
    });

    assert.deepEqual(blocked, ["left-pad"]);
  });

  it("returns curated public demo search results without relying on npm search", () => {
    const results = searchPublicDemoPackages("material");

    assert.deepEqual(
      results.map((result) => result.package.name),
      ["@mui/material"]
    );
  });
});
