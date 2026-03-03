import { RawDocFile, ResolvedSourceCandidate } from "../../types";

const MAX_URLS = 120;
const NOISY_URL_PATTERN =
  /(discord|youtube|x\.com|twitter\.com|linkedin|reddit|badge|img\.shields|\.svg($|\?)|\.png($|\?)|\.jpg($|\?)|\.jpeg($|\?)|\.gif($|\?)|\/share\/|\/watch($|\?))/i;

function inferContentType(
  url: string,
  contentType: string | null,
): RawDocFile["contentType"] {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.endsWith(".mdx")) return "mdx";
  if (lowercaseUrl.endsWith(".md") || contentType?.includes("markdown")) {
    return "markdown";
  }
  if (contentType?.includes("json")) return "json";
  if (contentType?.includes("html")) return "html";
  return "text";
}

function relativePathFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return path.length > 0 ? path : fallback;
  } catch {
    return fallback;
  }
}

function resolveCandidateUrl(base: URL, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const resolved = new URL(trimmed, base);
    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

function extractLinksFromLine(base: URL, line: string): string[] {
  const links: string[] = [];

  for (const match of line.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const url = resolveCandidateUrl(base, match[1] ?? "");
    if (url) links.push(url);
  }

  for (const match of line.matchAll(/https?:\/\/[^\s)]+/g)) {
    const url = resolveCandidateUrl(base, match[0]);
    if (url) links.push(url);
  }

  if (links.length === 0 && /^[-*]\s+\/?[\w./-]+$/.test(line.trim())) {
    const raw = line.replace(/^[-*]\s+/, "").trim();
    const url = resolveCandidateUrl(base, raw);
    if (url) links.push(url);
  }

  return links;
}

function isAllowedUrl(
  url: string,
  baseHost: string,
  candidate: ResolvedSourceCandidate,
): boolean {
  if (NOISY_URL_PATTERN.test(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const allowedHosts = candidate.allowedHostnames ?? [baseHost];

    if (!allowedHosts.some((host) => parsed.hostname === host)) {
      return false;
    }

    if (candidate.includePathPrefixes && candidate.includePathPrefixes.length > 0) {
      const pathname = parsed.pathname.replace(/^\//, "");
      const isAllowedPrefix = candidate.includePathPrefixes.some((prefix) =>
        pathname.toLowerCase().startsWith(prefix.replace(/^\//, "").toLowerCase()),
      );

      if (!isAllowedPrefix) {
        return false;
      }
    }

    if (candidate.excludePathPatterns && candidate.excludePathPatterns.length > 0) {
      const pathname = parsed.pathname;
      const isExcluded = candidate.excludePathPatterns.some((pattern) =>
        new RegExp(pattern, "i").test(pathname),
      );

      if (isExcluded) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function parseLlmsIndexLinks(
  content: string,
  sourceUrl: string,
  candidate: ResolvedSourceCandidate,
): string[] {
  const base = new URL(sourceUrl);
  const links = new Set<string>();

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    for (const link of extractLinksFromLine(base, trimmed)) {
      if (isAllowedUrl(link, base.hostname, candidate)) {
        links.add(link);
      }
    }
  }

  return Array.from(links).slice(0, candidate.maxFiles ?? MAX_URLS);
}

export async function fetchFromLlms(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const indexResponse = await fetch(candidate.url);

  if (!indexResponse.ok) {
    throw new Error(`Failed to fetch llms source: ${candidate.url}`);
  }

  const llmsContent = await indexResponse.text();

  if (candidate.kind === "llms_full") {
    return [
      {
        relativePath: "llms-full.md",
        content: llmsContent,
        sourceUrl: candidate.url,
        contentType: "markdown",
      },
    ];
  }

  const links = parseLlmsIndexLinks(llmsContent, candidate.url, candidate);

  const files: RawDocFile[] = [
    {
      relativePath: "llms-index.txt",
      content: llmsContent,
      sourceUrl: candidate.url,
      contentType: "text",
    },
  ];

  for (const [index, link] of links.entries()) {
    try {
      const response = await fetch(link);
      if (!response.ok) continue;

      const content = await response.text();
      const type = inferContentType(link, response.headers.get("content-type"));

      files.push({
        relativePath: relativePathFromUrl(link, `doc-${index + 1}.md`),
        content,
        sourceUrl: link,
        contentType: type,
      });
    } catch {
      // Keep iterating; llms expansion is best effort.
    }
  }

  return files;
}
