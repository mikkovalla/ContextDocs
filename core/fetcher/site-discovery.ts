import * as cheerio from "cheerio";
import { ResolvedSourceCandidate } from "../../types";

const MAX_DISCOVERED_URLS = 80;
const MAX_CRAWL_VISITS = 40;
const MAX_NESTED_SITEMAPS = 6;
const REQUEST_HEADERS = {
  Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "DocBrain/2.0 (+https://github.com)",
};

function normalizeHref(baseUrl: URL, href: string): string | null {
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.origin !== baseUrl.origin) return null;
    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

export function shouldVisitSiteUrl(
  url: string,
  candidate: ResolvedSourceCandidate,
): boolean {
  if (/(\/blog\/|\/news\/|\/changelog\/|\/releases\/|\/community\/|\/discord)/i.test(url)) {
    return false;
  }

  try {
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
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: REQUEST_HEADERS });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function discoverRobotsSitemaps(baseUrl: URL): Promise<string[]> {
  const robotsUrl = new URL("/robots.txt", baseUrl.origin).toString();
  const text = await fetchText(robotsUrl);
  if (!text) return [];

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, "").trim())
    .filter(Boolean);
}

function defaultSitemapUrls(baseUrl: URL): string[] {
  return [
    new URL("/sitemap.xml", baseUrl.origin).toString(),
    new URL("/sitemap_index.xml", baseUrl.origin).toString(),
  ];
}

function prioritizeUrls(
  urls: string[],
  startUrl: string,
  candidate: ResolvedSourceCandidate,
): string[] {
  const unique = Array.from(
    new Set(
      [startUrl, ...urls].filter((url) => shouldVisitSiteUrl(url, candidate)),
    ),
  );

  return unique
    .sort((a, b) => {
      if (a === startUrl) return -1;
      if (b === startUrl) return 1;

      const depthA = new URL(a).pathname.split("/").filter(Boolean).length;
      const depthB = new URL(b).pathname.split("/").filter(Boolean).length;
      if (depthA !== depthB) {
        return depthA - depthB;
      }

      return a.localeCompare(b);
    })
    .slice(0, MAX_DISCOVERED_URLS);
}

async function parseSitemap(
  sitemapUrl: string,
  candidate: ResolvedSourceCandidate,
  seenSitemaps: Set<string>,
  collectedUrls: Set<string>,
): Promise<void> {
  if (seenSitemaps.has(sitemapUrl) || seenSitemaps.size >= MAX_NESTED_SITEMAPS) {
    return;
  }

  seenSitemaps.add(sitemapUrl);
  const xml = await fetchText(sitemapUrl);
  if (!xml) return;

  const $ = cheerio.load(xml, { xmlMode: true });
  const nestedSitemaps = $("sitemap > loc")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean);

  for (const nested of nestedSitemaps) {
    if (collectedUrls.size >= MAX_DISCOVERED_URLS) break;
    await parseSitemap(nested, candidate, seenSitemaps, collectedUrls);
  }

  const urls = $("url > loc")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean);

  for (const url of urls) {
    if (shouldVisitSiteUrl(url, candidate)) {
      collectedUrls.add(url);
    }

    if (collectedUrls.size >= MAX_DISCOVERED_URLS) {
      break;
    }
  }
}

async function discoverFromSitemaps(
  startUrl: URL,
  candidate: ResolvedSourceCandidate,
): Promise<string[]> {
  const sitemapUrls = Array.from(
    new Set([
      ...(await discoverRobotsSitemaps(startUrl)),
      ...defaultSitemapUrls(startUrl),
    ]),
  );
  const collectedUrls = new Set<string>();
  const seenSitemaps = new Set<string>();

  for (const sitemapUrl of sitemapUrls) {
    if (collectedUrls.size >= MAX_DISCOVERED_URLS) break;
    await parseSitemap(sitemapUrl, candidate, seenSitemaps, collectedUrls);
  }

  return prioritizeUrls(Array.from(collectedUrls), startUrl.toString(), candidate);
}

function extractCanonicalUrl(baseUrl: URL, html: string): string | null {
  try {
    const $ = cheerio.load(html);
    const href = $('link[rel="canonical"]').attr("href");
    if (!href) return null;
    return normalizeHref(baseUrl, href);
  } catch {
    return null;
  }
}

async function discoverByCrawling(
  candidate: ResolvedSourceCandidate,
): Promise<string[]> {
  const startUrl = new URL(candidate.url);
  const queue = [startUrl.toString()];
  const visited = new Set<string>();
  const discovered = new Set<string>();

  while (queue.length > 0 && visited.size < MAX_CRAWL_VISITS) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl) || !shouldVisitSiteUrl(currentUrl, candidate)) {
      continue;
    }

    visited.add(currentUrl);
    const html = await fetchText(currentUrl);
    if (!html) continue;

    const canonicalUrl = extractCanonicalUrl(startUrl, html);
    const effectiveUrl =
      canonicalUrl && shouldVisitSiteUrl(canonicalUrl, candidate)
        ? canonicalUrl
        : currentUrl;
    discovered.add(effectiveUrl);

    const $ = cheerio.load(html);
    const links = $("a[href]")
      .map((_, element) => normalizeHref(startUrl, $(element).attr("href") ?? ""))
      .get()
      .filter((url): url is string => Boolean(url));

    for (const link of links) {
      if (
        !visited.has(link) &&
        shouldVisitSiteUrl(link, candidate) &&
        !discovered.has(link)
      ) {
        queue.push(link);
      }
    }
  }

  return prioritizeUrls(Array.from(discovered), startUrl.toString(), candidate);
}

export async function discoverSiteUrls(
  candidate: ResolvedSourceCandidate,
): Promise<string[]> {
  const startUrl = new URL(candidate.url);
  const sitemapUrls = await discoverFromSitemaps(startUrl, candidate);
  if (sitemapUrls.length > 0) {
    return sitemapUrls;
  }

  return discoverByCrawling(candidate);
}
