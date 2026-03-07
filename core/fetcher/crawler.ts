import { RawDocFile, ResolvedSourceCandidate } from "../../types";
import { discoverSiteUrls } from "./site-discovery";

const MAX_PAGES = 30;
const REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "User-Agent": "DocBrain/2.0 (+https://github.com)",
};

async function fetchHtmlPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: REQUEST_HEADERS });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!/(text\/html|application\/xhtml\+xml)/i.test(contentType)) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

function relativePath(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname.replace(/^\/+/, "");
    const path = normalizedPath.length > 0 ? normalizedPath : `page-${index + 1}`;
    return path.endsWith("/") ? `${path}index` : path;
  } catch {
    return `page-${index + 1}`;
  }
}

export async function fetchFromSitemapSite(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const urls = await discoverSiteUrls(candidate);
  const files: RawDocFile[] = [];

  for (const [index, url] of urls.slice(0, candidate.maxFiles ?? MAX_PAGES).entries()) {
    const html = await fetchHtmlPage(url);
    if (!html) continue;

    files.push({
      relativePath: relativePath(url, index),
      content: html,
      sourceUrl: url,
      contentType: "html",
    });
  }

  return files;
}
