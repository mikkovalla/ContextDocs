import * as cheerio from "cheerio";
import { RawDocFile, ResolvedSourceCandidate } from "../../types";

const MAX_PAGES = 30;

function normalizeHref(baseUrl: URL, href: string): string | null {
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.origin !== baseUrl.origin) return null;
    if (resolved.hash) resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

function shouldVisit(url: string, candidate: ResolvedSourceCandidate): boolean {
  if (/(\/blog\/|\/news\/|\/changelog\/|\/releases\/|\/community\/|\/discord)/i.test(url)) {
    return false;
  }

  const parsed = new URL(url);
  const normalizedPath = parsed.pathname.replace(/^\/+/, "");

  if (candidate.includePathPrefixes && candidate.includePathPrefixes.length > 0) {
    const inAllowedPrefix = candidate.includePathPrefixes.some((prefix) =>
      normalizedPath
        .toLowerCase()
        .startsWith(prefix.replace(/^\/+/, "").toLowerCase()),
    );

    if (!inAllowedPrefix) {
      return false;
    }
  }

  if (candidate.excludePathPatterns && candidate.excludePathPatterns.length > 0) {
    const excluded = candidate.excludePathPatterns.some((pattern) =>
      new RegExp(pattern, "i").test(parsed.pathname),
    );
    if (excluded) {
      return false;
    }
  }

  return true;
}

function markdownFromHtml(url: string, html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript").remove();
  const title = $("h1").first().text().trim() || $("title").text().trim() || "Documentation";
  const bodyText = $("main, article, body").text().replace(/\s+/g, " ").trim();
  return `# ${title}\n\nSource: ${url}\n\n${bodyText}`;
}

function relativePath(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, "") || `page-${index + 1}`;
    return `${path}.md`;
  } catch {
    return `page-${index + 1}.md`;
  }
}

export async function fetchFromSitemapSite(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const startUrl = new URL(candidate.url);
  const queue = [startUrl.toString()];
  const visited = new Set<string>();
  const files: RawDocFile[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const currentUrl = queue.shift()!;

    if (visited.has(currentUrl) || !shouldVisit(currentUrl, candidate)) {
      continue;
    }

    visited.add(currentUrl);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        headers: { "User-Agent": "DocBrain/2.0 (+https://github.com)" },
      });
    } catch {
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const markdown = markdownFromHtml(currentUrl, html);

    files.push({
      relativePath: relativePath(currentUrl, files.length),
      content: markdown,
      sourceUrl: currentUrl,
      contentType: "markdown",
    });

    const $ = cheerio.load(html);
    const links = $("a[href]")
      .map((_, element) => normalizeHref(startUrl, $(element).attr("href") ?? ""))
      .get()
      .filter((url): url is string => Boolean(url));

    for (const link of links) {
      if (!visited.has(link) && shouldVisit(link, candidate)) {
        queue.push(link);
      }
    }
  }

  return files;
}
