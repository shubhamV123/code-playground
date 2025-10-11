import React, { useState, useEffect } from "react";
import {
  VscSearch,
  VscPackage,
  VscTrash,
  VscLoading,
  VscWarning,
  VscInfo,
  VscChevronDown,
  VscChevronUp,
} from "react-icons/vsc";
import {
  searchNpmPackages,
  getPackageVersions,
  type NpmSearchResult,
} from "../utils/npmApi";
import { resolveAndPrepareInstallation } from "../utils/dependencyResolver";
import { useFileSystemStore } from "../store/fileSystemStore";

interface PackageManagerProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const PackageManager: React.FC<PackageManagerProps> = ({
  isExpanded,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NpmSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [availableVersions, setAvailableVersions] = useState<
    Record<string, string[]>
  >({});
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, string>
  >({});
  const [loadingVersions, setLoadingVersions] = useState<
    Record<string, boolean>
  >({});
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationResult, setInstallationResult] = useState<{
    success: boolean;
    message: string;
    warnings?: string[];
  } | null>(null);

  const { addPackages, removePackage, getInstalledPackages } =
    useFileSystemStore();
  const installedPackages = getInstalledPackages();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchNpmPackages(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleExpandPackage = async (
    packageName: string,
    latestVersion: string
  ) => {
    if (expandedPackage === packageName) {
      // Collapse if already expanded
      setExpandedPackage(null);
      return;
    }

    setExpandedPackage(packageName);
    setLoadingVersions({ ...loadingVersions, [packageName]: true });

    // Set default version to latest
    setSelectedVersions({ ...selectedVersions, [packageName]: latestVersion });

    // Fetch versions if not already cached
    if (!availableVersions[packageName]) {
      const versions = await getPackageVersions(packageName);
      setAvailableVersions({ ...availableVersions, [packageName]: versions });
    }

    setLoadingVersions({ ...loadingVersions, [packageName]: false });
  };

  const handleInstallPackage = async (packageName: string) => {
    const version = selectedVersions[packageName];
    if (!version) return;

    setIsInstalling(true);
    setInstallationResult(null);

    try {
      // Resolve dependencies including peer dependencies
      const result = await resolveAndPrepareInstallation(
        packageName,
        version,
        installedPackages
      );

      if (result.errors.length > 0) {
        setInstallationResult({
          success: false,
          message: `Failed to install ${packageName}: ${result.errors.join(
            ", "
          )}`,
        });
        setIsInstalling(false);
        return;
      }

      // Install all resolved packages
      if (Object.keys(result.toInstall).length > 0) {
        addPackages(result.toInstall);

        setInstallationResult({
          success: true,
          message: result.summary,
          warnings: result.warnings.length > 0 ? result.warnings : undefined,
        });

        // Clear UI state after successful install
        setTimeout(() => {
          setExpandedPackage(null);
          setSearchQuery("");
          setSearchResults([]);
          setInstallationResult(null);
        }, 30000);
      } else {
        setInstallationResult({
          success: true,
          message: `${packageName} is already installed`,
        });
      }
    } catch (error) {
      setInstallationResult({
        success: false,
        message: `Failed to install ${packageName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemovePackage = (packageName: string) => {
    removePackage(packageName);
  };

  return (
    <div className={`flex flex-col bg-[#1e1e1e] border-t border-gray-700 ${isExpanded ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? 'Collapse Dependencies' : 'Expand Dependencies'}
          >
            {isExpanded ? (
              <VscChevronDown className="w-4 h-4 text-gray-300" />
            ) : (
              <VscChevronUp className="w-4 h-4 text-gray-300" />
            )}
          </button>
          <VscPackage className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">Dependencies</span>
          <span className="text-xs text-gray-500">
            ({Object.keys(installedPackages).length})
          </span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {/* Installation Result */}
          {installationResult && (
            <div
              className={`mx-3 mt-3 p-3 rounded border text-xs ${
                installationResult.success
                  ? "bg-green-900/10 border-green-700/50 text-green-300"
                  : "bg-red-900/10 border-red-700/50 text-red-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {installationResult.success ? (
                  <VscInfo className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                ) : (
                  <VscWarning className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium leading-tight">
                    {installationResult.message}
                  </p>
                  {installationResult.warnings &&
                    installationResult.warnings.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {installationResult.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <VscWarning className="w-3 h-3 flex-shrink-0 mt-0.5 text-yellow-400" />
                            <span className="text-yellow-300">{warning}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="px-3 py-3 border-b border-gray-700">
            <div className="relative">
              <VscSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages..."
                className="w-full bg-[#3c3c3c] text-gray-100 pl-8 pr-3 py-1.5 rounded text-xs border border-gray-600 focus:outline-none focus:border-blue-500 focus:bg-[#2d2d30]"
              />
            </div>
          </div>

          {/* Installed Packages */}
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Installed
              </h3>
              <span className="text-xs text-gray-500">
                {Object.keys(installedPackages).length}
              </span>
            </div>
            {Object.keys(installedPackages).length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                No packages installed
              </p>
            ) : (
              <div className="space-y-0.5">
                {Object.entries(installedPackages).map(([name, version]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between group hover:bg-[#2d2d30] px-2 py-1.5 rounded cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">
                        {name}
                      </p>
                      <p className="text-[10px] text-gray-500">v{version}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePackage(name)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all ml-2"
                      title="Remove package"
                    >
                      <VscTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="border-t border-gray-700">
              {isSearching && (
                <p className="text-xs text-gray-500 text-center py-6">
                  Searching...
                </p>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-[#252526] border-b border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Search Results
                    </h3>
                  </div>
                  <div className="px-3 py-2 space-y-0.5">
                    {searchResults.map((result) => {
                      const isInstalled = installedPackages[result.package.name];
                      const isExpanded = expandedPackage === result.package.name;
                      const versions = availableVersions[result.package.name] || [];
                      const isLoading = loadingVersions[result.package.name];

                      return (
                        <div
                          key={result.package.name}
                          className="hover:bg-[#2d2d30] rounded transition-colors"
                        >
                          <div className="flex items-start justify-between px-2 py-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-medium text-gray-200 truncate">
                                  {result.package.name}
                                </h4>
                                {isInstalled && (
                                  <span className="text-[9px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                                    Installed
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                                {result.package.description || "No description"}
                              </p>
                              <p className="text-[10px] text-gray-600 mt-0.5">
                                v{result.package.version}
                              </p>
                            </div>
                            {!isInstalled && !isExpanded && (
                              <button
                                onClick={() =>
                                  handleExpandPackage(
                                    result.package.name,
                                    result.package.version
                                  )
                                }
                                disabled={isInstalling}
                                className="flex-shrink-0 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-[10px] rounded transition-colors font-medium"
                              >
                                Add
                              </button>
                            )}
                          </div>

                          {/* Inline version selector */}
                          {isExpanded && !isInstalled && (
                            <div className="px-2 pb-2 pt-1 border-t border-gray-700/50 mt-1">
                              {isLoading ? (
                                <p className="text-[10px] text-gray-500 py-2">
                                  Loading versions...
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-[10px] text-gray-400 mb-1">
                                      Version
                                    </label>
                                    <select
                                      value={
                                        selectedVersions[result.package.name] ||
                                        result.package.version
                                      }
                                      onChange={(e) =>
                                        setSelectedVersions({
                                          ...selectedVersions,
                                          [result.package.name]: e.target.value,
                                        })
                                      }
                                      className="w-full bg-[#3c3c3c] text-gray-100 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-[10px]"
                                    >
                                      {versions.map((version) => (
                                        <option key={version} value={version}>
                                          {version}
                                          {version === versions[0] ? " (latest)" : ""}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() =>
                                        handleInstallPackage(result.package.name)
                                      }
                                      disabled={isInstalling}
                                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-[10px] rounded transition-colors flex items-center justify-center gap-1 font-medium"
                                    >
                                      {isInstalling ? (
                                        <>
                                          <VscLoading className="w-3 h-3 animate-spin" />
                                          Installing...
                                        </>
                                      ) : (
                                        "Install"
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setExpandedPackage(null)}
                                      className="px-2 py-1 bg-[#3c3c3c] hover:bg-[#505050] text-gray-300 text-[10px] rounded transition-colors font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">
                  No packages found
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
