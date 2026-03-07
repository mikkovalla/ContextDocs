import {
  FetchResult,
  RawDocFile,
  ResolvedSourceCandidate,
  ResolvedTarget,
} from "../../types";
import { fetchFromSitemapSite } from "./crawler";
import { applyPathFilters, enforceMaxFiles } from "./filters";
import { fetchFromGitHubTree } from "./github";
import { fetchFromLlms } from "./llms";
import { fetchFromReadme } from "./readme";
import { fetchFromRegistryJson } from "./registry-json";

async function fetchByKind(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  switch (candidate.kind) {
    case "llms_txt":
    case "llms_full":
      return fetchFromLlms(candidate);
    case "github_tree":
      return fetchFromGitHubTree(candidate);
    case "registry_json":
      return fetchFromRegistryJson(candidate);
    case "sitemap_site":
      return fetchFromSitemapSite(candidate);
    case "readme":
      return fetchFromReadme(candidate);
    default:
      return [];
  }
}

const LOW_SIGNAL_PATH_PATTERNS = [
  /(^|\/)admin\.md$/i,
  /(^|\/)contributing/i,
  /(^|\/)changelog/i,
  /(^|\/)release[-_ ]notes/i,
  /(^|\/)issues?/i,
  /(^|\/)pull[-_ ]requests?/i,
  /(^|\/)_fixtures?\//i,
  /(^|\/)troubleshooting\//i,
  /(^|\/)_template\.md$/i,
  /(^|\/)badge\//i,
  /(^|\/)share\//i,
  /(^|\/)watch\.md$/i,
  /%22|%3e|%3c/i,
];

function isLowSignalPath(path: string): boolean {
  return LOW_SIGNAL_PATH_PATTERNS.some((pattern) => pattern.test(path));
}
function previewContent(file: RawDocFile): string {
  if (file.contentType === "html") {
    return file.content
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000)
      .toLowerCase();
  }

  return file.content.slice(0, 6000).toLowerCase();
}

function hasCoreDocSignals(file: RawDocFile): boolean {
  const preview = previewContent(file);

  if (
    file.contentType === "html" &&
    /<(h1|h2|article|main|pre|code|table)\b/i.test(file.content)
  ) {
    return true;
  }

  return (
    /\n#{1,3}\s+(api|reference|usage|getting started|installation|guide)\b/i.test(
      preview,
    ) || /\b(api|reference|usage|installation|guide)\b/i.test(file.relativePath)
  );
}

function qualityGatePasses(
  target: ResolvedTarget,
  candidate: ResolvedSourceCandidate,
  files: RawDocFile[],
): { ok: boolean; filteredFiles: RawDocFile[]; reason?: string } {
  if (files.length === 0) {
    return { ok: false, filteredFiles: [], reason: "No files returned." };
  }

  const filtered = files
    .filter((file) => !isLowSignalPath(file.relativePath))
    .filter(
      (file) =>
        !/(discord|youtube|twitter|x\\.com|linkedin|reddit)/i.test(
          file.sourceUrl,
        ),
    );

  if (filtered.length === 0) {
    return {
      ok: false,
      filteredFiles: [],
      reason: "Only low-signal files returned.",
    };
  }

  if (candidate.kind === "readme") {
    const best = filtered.find((file) => /readme/i.test(file.relativePath));
    return {
      ok: Boolean(best ?? filtered[0]),
      filteredFiles: [best ?? filtered[0]],
      reason: best ? undefined : "README fallback selected.",
    };
  }

  if (candidate.kind === "registry_json") {
    return {
      ok: filtered.length > 0,
      filteredFiles: filtered,
      reason: filtered.length > 0 ? undefined : "Registry payload was empty.",
    };
  }

  if (candidate.kind === "llms_full") {
    return {
      ok: filtered.length > 0,
      filteredFiles: filtered,
      reason:
        filtered.length > 0 ? undefined : "llms_full returned empty content.",
    };
  }

  if (
    target.packageName.startsWith("@types/") &&
    candidate.kind === "github_tree"
  ) {
    return {
      ok: false,
      filteredFiles: [],
      reason: "Rejected guessed GitHub docs for @types package.",
    };
  }

  if (filtered.length === 1 && !hasCoreDocSignals(filtered[0])) {
    return {
      ok: false,
      filteredFiles: [],
      reason: "Single file did not contain core doc signals.",
    };
  }

  if (candidate.kind === "llms_txt") {
    const expandedDocs = filtered.filter(
      (file) => !/llms-(index|full)\.(txt|md)$/i.test(file.relativePath),
    );
    if (expandedDocs.length === 0) {
      return {
        ok: false,
        filteredFiles: [],
        reason: "llms.txt did not expand into documentation pages.",
      };
    }

    return {
      ok: true,
      filteredFiles: expandedDocs,
    };
  }

  return {
    ok: true,
    filteredFiles: filtered,
  };
}

export async function fetchDocumentation(
  target: ResolvedTarget,
): Promise<FetchResult> {
  const attempts: FetchResult["attempts"] = [];

  for (const candidate of target.sourceCandidates) {
    try {
      const files = await fetchByKind(candidate);
      const candidateFiltered = enforceMaxFiles(
        applyPathFilters(files, candidate),
        candidate,
      );
      const quality = qualityGatePasses(target, candidate, candidateFiltered);

      attempts.push({
        kind: candidate.kind,
        url: candidate.url,
        success: quality.ok,
        fileCount: quality.filteredFiles.length,
        error: quality.reason,
      });

      if (quality.ok) {
        return {
          files: quality.filteredFiles,
          attempts,
          selectedSource: candidate,
        };
      }
    } catch (error) {
      attempts.push({
        kind: candidate.kind,
        url: candidate.url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    files: [],
    attempts,
    selectedSource: target.selectedSource,
  };
}
