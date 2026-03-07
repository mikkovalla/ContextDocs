import { ResolvedSourceCandidate, ResolvedTarget } from "../../types";

export type PackageProfile = {
  compositionType: ResolvedTarget["compositionType"];
  candidates: ResolvedSourceCandidate[];
};

export const PACKAGE_PROFILES: Record<string, PackageProfile> = {
  react: {
    compositionType: "mdx_tree",
    candidates: [
      {
        kind: "github_tree",
        url: "https://github.com/reactjs/react.dev/tree/main/src/content",
        description: "React official docs content",
        docStability: "stable",
        excludePathPatterns: [
          "^blog/",
          "^community/",
          "^errors/",
          "^warnings/",
        ],
      },
      {
        kind: "sitemap_site",
        url: "https://react.dev/reference",
        description: "React docs website reference",
        docStability: "stable",
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
        description: "Next.js docs in source repo (canary)",
        docStability: "prerelease",
        excludePathPatterns: ["^04-community/"],
      },
      {
        kind: "llms_txt",
        url: "https://nextjs.org/llms.txt",
        description: "Next.js llms index",
        docStability: "stable",
        allowedHostnames: ["nextjs.org"],
        includePathPrefixes: ["docs"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://nextjs.org/docs",
        description: "Next.js public docs",
        docStability: "stable",
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
        docStability: "stable",
      },
      {
        kind: "sitemap_site",
        url: "https://docs.nestjs.com",
        description: "Nest public docs",
        docStability: "stable",
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
        docStability: "stable",
        maxFiles: 140,
      },
      {
        kind: "sitemap_site",
        url: "https://zod.dev",
        description: "Zod docs website",
        docStability: "stable",
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
        docStability: "stable",
        allowedHostnames: ["orm.drizzle.team"],
        includePathPrefixes: ["docs"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://orm.drizzle.team/docs",
        description: "Drizzle docs website",
        docStability: "stable",
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
        docStability: "stable",
        allowedHostnames: ["orm.drizzle.team"],
        includePathPrefixes: ["docs/zod"],
        maxFiles: 60,
      },
      {
        kind: "sitemap_site",
        url: "https://orm.drizzle.team/docs/zod",
        description: "Drizzle Zod docs section",
        docStability: "stable",
        includePathPrefixes: ["docs/zod"],
        maxFiles: 60,
      },
      {
        kind: "readme",
        url: "npm:drizzle-zod",
        description: "Package README from npm registry",
        docStability: "stable",
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
        docStability: "stable",
        maxFiles: 300,
      },
      {
        kind: "sitemap_site",
        url: "https://tailwindcss.com/docs",
        description: "Tailwind docs website",
        docStability: "stable",
        includePathPrefixes: ["docs"],
        maxFiles: 220,
      },
    ],
  },
  daisyui: {
    compositionType: "website_docs",
    candidates: [
      {
        kind: "llms_txt",
        url: "https://daisyui.com/llms.txt",
        description: "daisyUI llms index",
        docStability: "stable",
        includePathPrefixes: ["components", "docs"],
        excludePathPatterns: ["(^|/)editor/?$", "(^|/)theme-generator/?$"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://daisyui.com/docs",
        description: "daisyUI docs site",
        docStability: "stable",
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
        docStability: "stable",
        excludePathPatterns: ["_fixtures?", "troubleshooting", "_template"],
        maxFiles: 120,
      },
      {
        kind: "sitemap_site",
        url: "https://supabase.com/docs/reference/javascript",
        description: "Supabase JS reference site",
        docStability: "stable",
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
        docStability: "stable",
        maxFiles: 20,
      },
      {
        kind: "sitemap_site",
        url: "https://ui.aceternity.com/docs",
        description: "Aceternity docs site",
        docStability: "stable",
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
        docStability: "stable",
      },
      {
        kind: "github_tree",
        url: "https://github.com/porsager/postgres/tree/master",
        description: "postgres source repo",
        docStability: "stable",
      },
    ],
  },
};
