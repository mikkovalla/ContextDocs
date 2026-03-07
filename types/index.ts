export type Ecosystem = "npm";

export type ParsedDependency = {
  name: string;
  version: string;
  ecosystem: Ecosystem;
};

export type NpmVersionStability = "stable" | "prerelease" | "unknown";

export type CandidateOrigin = "curated" | "metadata_fallback";

export type NpmVersionContext = {
  requestedVersion: string;
  normalizedVersion: string;
  exactVersion?: string;
  major?: number;
  minor?: number;
  patch?: number;
  prereleaseTag?: string;
  stability: NpmVersionStability;
  compatibilityTarget: string;
  reason: string;
};

export type SourceSelectionNote = {
  kind: DocsSourceKind;
  url: string;
  origin: CandidateOrigin;
  rank: number;
  reason: string;
};

export type StackAnalysisResult = {
  ecosystemsFound: Ecosystem[];
  dependencies: ParsedDependency[];
};

export type SourcePriority = "llms" | "github" | "crawl";

export type DocsSourceKind =
  | "llms_txt"
  | "llms_full"
  | "github_tree"
  | "registry_json"
  | "sitemap_site"
  | "readme";

export type CompositionType =
  | "markdown_tree"
  | "mdx_tree"
  | "website_docs"
  | "registry_docs"
  | "readme_first";

export type ResolvedSourceCandidate = {
  kind: DocsSourceKind;
  url: string;
  description: string;
  includePathPrefixes?: string[];
  excludePathPatterns?: string[];
  allowedHostnames?: string[];
  maxFiles?: number;
  docStability?: "stable" | "prerelease" | "any";
  supportedMajorVersions?: number[];
};

export type ResolvedTarget = {
  packageName: string;
  normalizedName: string;
  selectedSource: ResolvedSourceCandidate;
  sourceCandidates: ResolvedSourceCandidate[];
  sourceRanking: SourceSelectionNote[];
  versionContext: NpmVersionContext;
  compositionType: CompositionType;
  confidence: number;
};

export type RawDocFile = {
  relativePath: string;
  content: string;
  sourceUrl: string;
  contentType: "markdown" | "mdx" | "html" | "text" | "json";
};

export type FetchResult = {
  files: RawDocFile[];
  attempts: {
    kind: DocsSourceKind;
    url: string;
    success: boolean;
    error?: string;
    fileCount?: number;
  }[];
  selectedSource: ResolvedSourceCandidate;
};

export type SourceManifest = {
  packageName: string;
  normalizedName: string;
  compositionType: CompositionType;
  selectedSource: ResolvedSourceCandidate;
  selectedSourceReason: string;
  sourceCandidates: ResolvedSourceCandidate[];
  sourceRanking: SourceSelectionNote[];
  versionContext: NpmVersionContext;
  attempts: FetchResult["attempts"];
  fetchedFileCount: number;
  generatedAt: string;
};

export type DenseFileMap = {
  filePath: string;
  topic: string;
  headings: string[];
  featureRefs: string[];
  tags: string[];
  hint: string;
};
