import { RawDocFile, ResolvedSourceCandidate } from "../../types";

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}

function matchesIncludePrefixes(path: string, prefixes?: string[]): boolean {
  if (!prefixes || prefixes.length === 0) return true;

  const normalizedPath = normalizePath(path).toLowerCase();
  return prefixes.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix).toLowerCase();
    return normalizedPath.startsWith(normalizedPrefix);
  });
}

function matchesExcludePatterns(path: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;

  const normalizedPath = normalizePath(path);
  return patterns.some((pattern) => new RegExp(pattern, "i").test(normalizedPath));
}

export function applyPathFilters(
  files: RawDocFile[],
  candidate: ResolvedSourceCandidate,
): RawDocFile[] {
  return files.filter((file) => {
    if (!matchesIncludePrefixes(file.relativePath, candidate.includePathPrefixes)) {
      return false;
    }

    if (matchesExcludePatterns(file.relativePath, candidate.excludePathPatterns)) {
      return false;
    }

    return true;
  });
}

export function enforceMaxFiles(
  files: RawDocFile[],
  candidate: ResolvedSourceCandidate,
): RawDocFile[] {
  if (!candidate.maxFiles || candidate.maxFiles <= 0) {
    return files;
  }

  return files.slice(0, candidate.maxFiles);
}
