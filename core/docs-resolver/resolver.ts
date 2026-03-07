import {
  CandidateOrigin,
  NpmVersionContext,
  ParsedDependency,
  ResolvedSourceCandidate,
  ResolvedTarget,
  SourcePriority,
} from "../../types";
import { normalizeNpmPackageName } from "./npm-normalize";
import { PACKAGE_PROFILES } from "./npm-profiles";
import { fetchNpmPackageMetadata } from "./registry";
import {
  analyzeNpmVersion,
  evaluateCandidateCompatibility,
} from "./version-strategy";

const PRIORITY_ORDER: Record<
  SourcePriority,
  ResolvedSourceCandidate["kind"][]
> = {
  llms: [
    "llms_txt",
    "llms_full",
    "registry_json",
    "readme",
    "github_tree",
    "sitemap_site",
  ],
  github: [
    "github_tree",
    "readme",
    "llms_txt",
    "llms_full",
    "registry_json",
    "sitemap_site",
  ],
  crawl: [
    "sitemap_site",
    "llms_txt",
    "llms_full",
    "github_tree",
    "registry_json",
    "readme",
  ],
};

type CandidateWithOrigin = {
  candidate: ResolvedSourceCandidate;
  origin: CandidateOrigin;
  curated: boolean;
};

function keyForCandidate(candidate: ResolvedSourceCandidate): string {
  return `${candidate.kind}|${candidate.url}`;
}

function uniqCandidates(
  candidates: CandidateWithOrigin[],
): CandidateWithOrigin[] {
  const dedup = new Map<string, CandidateWithOrigin>();

  for (const item of candidates) {
    const key = keyForCandidate(item.candidate);
    const existing = dedup.get(key);

    if (!existing || (!existing.curated && item.curated)) {
      dedup.set(key, item);
    }
  }

  return Array.from(dedup.values());
}

function rankCandidates(
  candidates: CandidateWithOrigin[],
  sourcePriority: SourcePriority,
  versionContext: NpmVersionContext,
): Array<
  CandidateWithOrigin & {
    compatibilityScore: number;
    compatibilityReason: string;
    priorityIndex: number;
  }
> {
  const order = PRIORITY_ORDER[sourcePriority];
  return candidates
    .map((item) => {
      const compatibility = evaluateCandidateCompatibility(
        item.candidate,
        versionContext,
      );
      const priorityIndex = order.indexOf(item.candidate.kind);

      return {
        ...item,
        compatibilityScore: compatibility.score,
        compatibilityReason: compatibility.reason,
        priorityIndex: priorityIndex === -1 ? Number.MAX_SAFE_INTEGER : priorityIndex,
      };
    })
    .sort((a, b) => {
      if (a.curated !== b.curated) {
        return a.curated ? -1 : 1;
      }

      if (a.compatibilityScore !== b.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }

      if (a.priorityIndex !== b.priorityIndex) {
        return a.priorityIndex - b.priorityIndex;
      }

      return a.candidate.url.localeCompare(b.candidate.url);
    });
}

function isLikelyDocsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === "github.com") {
      return false;
    }

    if (path.includes("/issues") || path.includes("/pulls")) {
      return false;
    }

    if (host.startsWith("docs.") || path.includes("/docs")) {
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

function shouldGuessGithubDocs(packageName: string): boolean {
  if (packageName.startsWith("@types/")) {
    return false;
  }

  return true;
}

function fallbackCandidatesFromMetadata(
  packageName: string,
  metadata: Awaited<ReturnType<typeof fetchNpmPackageMetadata>>,
): ResolvedSourceCandidate[] {
  const fallbacks: ResolvedSourceCandidate[] = [
    {
      kind: "readme",
      url: `npm:${packageName}`,
      description: "README from npm registry metadata",
    },
  ];

  if (!metadata) {
    return fallbacks;
  }

  if (
    metadata.repositoryUrl?.includes("github.com") &&
    shouldGuessGithubDocs(packageName)
  ) {
    fallbacks.push({
      kind: "github_tree",
      url: `${metadata.repositoryUrl}/tree/main/docs`,
      description: "Repository docs directory guess",
    });
    fallbacks.push({
      kind: "github_tree",
      url: `${metadata.repositoryUrl}/tree/master/docs`,
      description: "Repository docs directory guess (master)",
    });
  }

  if (metadata.docsUrl && isLikelyDocsUrl(metadata.docsUrl)) {
    fallbacks.push({
      kind: "sitemap_site",
      url: metadata.docsUrl,
      description: "Published docs URL from npm metadata",
    });
  }

  if (
    metadata.homepageUrl &&
    metadata.homepageUrl !== metadata.docsUrl &&
    isLikelyDocsUrl(metadata.homepageUrl)
  ) {
    fallbacks.push({
      kind: "sitemap_site",
      url: metadata.homepageUrl,
      description: "Homepage URL from npm metadata",
    });
  }

  return fallbacks;
}

export async function resolveDocsTargets(
  dependencies: ParsedDependency[],
  sourcePriority: SourcePriority = "llms",
): Promise<ResolvedTarget[]> {
  const npmDependencies = dependencies.filter((dep) => dep.ecosystem === "npm");
  const targets: ResolvedTarget[] = [];

  for (const dep of npmDependencies) {
    const normalizedName = normalizeNpmPackageName(dep.name);
    const profile = PACKAGE_PROFILES[normalizedName];

    const metadata = await fetchNpmPackageMetadata(dep.name);
    const fallbackCandidates = fallbackCandidatesFromMetadata(
      dep.name,
      metadata,
    );

    const candidates = uniqCandidates([
      ...(profile?.candidates ?? []).map((candidate) => ({
        candidate,
        origin: "curated" as const,
        curated: true,
      })),
      ...fallbackCandidates.map((candidate) => ({
        candidate,
        origin: "metadata_fallback" as const,
        curated: false,
      })),
    ]);

    if (candidates.length === 0) {
      continue;
    }

    const versionContext = analyzeNpmVersion(dep.version);
    const rankedCandidates = rankCandidates(
      candidates,
      sourcePriority,
      versionContext,
    );
    const resolvedCandidates = rankedCandidates.map((item) => item.candidate);

    targets.push({
      packageName: dep.name,
      normalizedName,
      selectedSource: resolvedCandidates[0],
      sourceCandidates: resolvedCandidates,
      sourceRanking: rankedCandidates.map((item, index) => ({
        kind: item.candidate.kind,
        url: item.candidate.url,
        origin: item.origin,
        rank: index + 1,
        reason: `${item.origin === "curated" ? "Curated npm profile candidate." : "Metadata fallback candidate."} ${item.compatibilityReason} Priority mode "${sourcePriority}" ranks ${item.candidate.kind} at position ${item.priorityIndex + 1}.`,
      })),
      versionContext,
      compositionType: profile?.compositionType ?? "website_docs",
      confidence: profile ? 0.95 : 0.7,
    });
  }

  return targets;
}
