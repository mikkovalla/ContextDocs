export type Ecosystem = "npm" | "maven" | "cargo" | "pypi";

export type ParsedDependency = {
  name: string;
  version: string;
  ecosystem: Ecosystem;
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
};

export type ResolvedTarget = {
  packageName: string;
  normalizedName: string;
  selectedSource: ResolvedSourceCandidate;
  sourceCandidates: ResolvedSourceCandidate[];
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
  sourceCandidates: ResolvedSourceCandidate[];
  attempts: FetchResult["attempts"];
  fetchedFileCount: number;
  generatedAt: string;
};

export type DenseFileMap = {
  filePath: string;
  topic: string;
  headings: string[];
  tags: string[];
  hint: string;
};
