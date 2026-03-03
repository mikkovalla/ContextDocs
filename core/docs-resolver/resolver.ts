import {
  ParsedDependency,
  ResolvedSourceCandidate,
  ResolvedTarget,
  SourcePriority,
} from "../../types";
import { normalizeNpmPackageName } from "./npm-normalize";
import { fetchNpmPackageMetadata } from "./registry";

type PackageProfile = {
  compositionType: ResolvedTarget["compositionType"];
  candidates: ResolvedSourceCandidate[];
};

const PACKAGE_PROFILES: Record<string, PackageProfile> = {
  react: {
    compositionType: "mdx_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/reactjs/react.dev/tree/main/src/content",
        description: "React official docs content",
        excludePathPatterns: ["^blog/", "^community/", "^errors/", "^warnings/"],
      },
      {
        kind: "sitemap_site",
        url: "https://react.dev/reference",
        description: "React docs website reference",
        includePathPrefixes: ["reference", "learn"],
        excludePathPatterns: ["blog", "community", "releases"],
      },
    ],
  },
  next: {
    compositionType: "mdx_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/vercel/next.js/tree/canary/docs",
        description: "Next.js docs in source repo",
        excludePathPatterns: ["^04-community/"],
      },
      {
        kind: "llms_txt",
        url: "https://nextjs.org/llms.txt",
        description: "Next.js llms index",
        allowedHostnames: ["nextjs.org"],
        includePathPrefixes: ["docs"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://nextjs.org/docs",
        description: "Next.js public docs",
        includePathPrefixes: ["docs"],
        maxFiles: 120,
      },
    ],
  },
  nestjs: {
    compositionType: "markdown_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/nestjs/docs.nestjs.com/tree/master/content",
        description: "Nest docs repo content",
      },
      {
        kind: "sitemap_site",
        url: "https://docs.nestjs.com",
        description: "Nest public docs",
      },
    ],
  },
  zod: {
    compositionType: "website_docs",
    candidates: [
      {
        kind: "llms_full",
        url: "https://zod.dev/llms-full.txt",
        description: "Zod llms full feed",
        maxFiles: 1,
      },
      {
        kind: "sitemap_site",
        url: "https://zod.dev",
        description: "Zod docs website",
        includePathPrefixes: ["api", "packages", "basics"],
        excludePathPatterns: ["discord", "watch", "share", "badge"],
        maxFiles: 80,
      },
    ],
  },
  "drizzle-orm": {
    compositionType: "website_docs",
    candidates: [
      {
        kind: "llms_txt",
        url: "https://orm.drizzle.team/llms.txt",
        description: "Drizzle llms feed",
        allowedHostnames: ["orm.drizzle.team"],
        includePathPrefixes: ["docs"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://orm.drizzle.team/docs",
        description: "Drizzle docs website",
        includePathPrefixes: ["docs"],
        excludePathPatterns: ["announcements", "blog", "releases"],
        maxFiles: 120,
      },
    ],
  },
  "drizzle-zod": {
    compositionType: "website_docs",
    candidates: [
      {
        kind: "llms_txt",
        url: "https://orm.drizzle.team/llms.txt",
        description: "Drizzle llms feed",
        allowedHostnames: ["orm.drizzle.team"],
        includePathPrefixes: ["docs/zod"],
        maxFiles: 60,
      },
      {
        kind: "sitemap_site",
        url: "https://orm.drizzle.team/docs/zod",
        description: "Drizzle Zod docs section",
        includePathPrefixes: ["docs/zod"],
        maxFiles: 60,
      },
      {
        kind: "readme",
        url: "npm:drizzle-zod",
        description: "Package README from npm registry",
      },
    ],
  },
  tailwindcss: {
    compositionType: "mdx_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/tailwindlabs/tailwindcss.com/tree/main/src/docs",
        description: "Tailwind docs source",
        maxFiles: 300,
      },
      {
        kind: "sitemap_site",
        url: "https://tailwindcss.com/docs",
        description: "Tailwind docs website",
        includePathPrefixes: ["docs"],
        maxFiles: 220,
      },
    ],
  },
  daisyui: {
    compositionType: "website_docs",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/saadeghi/daisyui/tree/master/packages/docs/src/routes/(routes)/docs",
        description: "daisyUI docs pages in source",
      },
      {
        kind: "sitemap_site",
        url: "https://daisyui.com/docs",
        description: "daisyUI docs site",
        includePathPrefixes: ["docs"],
        excludePathPatterns: ["blog", "frameworks"],
        maxFiles: 120,
      },
    ],
  },
  supabase: {
    compositionType: "mdx_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/supabase/supabase/tree/master/apps/docs/content/reference/javascript",
        description: "Supabase JavaScript SDK reference",
        excludePathPatterns: ["_fixtures?", "troubleshooting", "_template"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://supabase.com/docs/reference/javascript",
        description: "Supabase JS reference site",
        includePathPrefixes: ["docs/reference/javascript"],
        excludePathPatterns: ["troubleshooting", "_template"],
        maxFiles: 120,
      },
    ],
  },
  aceternity: {
    compositionType: "registry_docs",
    candidates: [
      {
        kind: "registry_json",
        url: "https://ui.aceternity.com/registry/bento-grid.json",
        description: "Aceternity registry sample endpoint",
        maxFiles: 20,
      },
      {
        kind: "sitemap_site",
        url: "https://ui.aceternity.com/docs",
        description: "Aceternity docs site",
        includePathPrefixes: ["docs/components", "docs"],
        excludePathPatterns: ["blog", "showcase"],
        maxFiles: 60,
      },
    ],
  },
  postgres: {
    compositionType: "readme_first",
    candidates: [
      {
        kind: "readme",
        url: "npm:postgres",
        description: "postgres package README",
      },
      {
        kind: "github_tree",
        url: "https://github.com/porsager/postgres/tree/master",
        description: "postgres source repo",
      },
    ],
  },
};

const PRIORITY_ORDER: Record<SourcePriority, ResolvedSourceCandidate["kind"][]> = {
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
): CandidateWithOrigin[] {
  const order = PRIORITY_ORDER[sourcePriority];

  return [...candidates].sort((a, b) => {
    if (a.curated !== b.curated) {
      return a.curated ? -1 : 1;
    }

    const idxA = order.indexOf(a.candidate.kind);
    const idxB = order.indexOf(b.candidate.kind);

    if (idxA !== idxB) {
      return idxA - idxB;
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
    const fallbackCandidates = fallbackCandidatesFromMetadata(dep.name, metadata);

    const candidates = uniqCandidates([
      ...(profile?.candidates ?? []).map((candidate) => ({
        candidate,
        curated: true,
      })),
      ...fallbackCandidates.map((candidate) => ({
        candidate,
        curated: false,
      })),
    ]);

    if (candidates.length === 0) {
      continue;
    }

    const rankedCandidates = rankCandidates(candidates, sourcePriority);
    const resolvedCandidates = rankedCandidates.map((item) => item.candidate);

    targets.push({
      packageName: dep.name,
      normalizedName,
      selectedSource: resolvedCandidates[0],
      sourceCandidates: resolvedCandidates,
      compositionType: profile?.compositionType ?? "website_docs",
      confidence: profile ? 0.95 : 0.7,
    });
  }

  return targets;
}
