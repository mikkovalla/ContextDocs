import { RawDocFile, ResolvedSourceCandidate } from "../../types";
import { fetchNpmPackageMetadata } from "../docs-resolver/registry";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

function packageNameFromCandidateUrl(url: string): string {
  if (!url.startsWith("npm:")) {
    throw new Error(`Unsupported README source URL: ${url}`);
  }

  return url.slice("npm:".length);
}

async function fetchReadmeFromCdn(packageName: string): Promise<string | null> {
  const cdnUrls = [
    `https://unpkg.com/${encodeURIComponent(packageName)}/README.md`,
    `https://cdn.jsdelivr.net/npm/${encodeURIComponent(packageName)}/README.md`,
  ];

  for (const url of cdnUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      if (text.trim().length > 80) {
        return text;
      }
    } catch {
      // Continue trying the next CDN URL.
    }
  }

  return null;
}

async function fetchReadmeFromLocalNodeModules(
  packageName: string,
): Promise<string | null> {
  const candidates = ["README.md", "readme.md", "Readme.md"];

  for (const filename of candidates) {
    const fullPath = join(process.cwd(), "node_modules", packageName, filename);
    try {
      await access(fullPath);
      const content = await readFile(fullPath, "utf8");
      if (content.trim().length > 80) {
        return content;
      }
    } catch {
      // Continue searching candidate filenames.
    }
  }

  return null;
}

export async function fetchFromReadme(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const packageName = packageNameFromCandidateUrl(candidate.url);
  const metadata = await fetchNpmPackageMetadata(packageName);
  const fallbackReadme =
    metadata?.readme ??
    (await fetchReadmeFromLocalNodeModules(packageName)) ??
    (await fetchReadmeFromCdn(packageName));
  if (!fallbackReadme) {
    throw new Error(`README missing for package ${packageName}`);
  }

  return [
    {
      relativePath: "README.md",
      content: fallbackReadme,
      sourceUrl: candidate.url,
      contentType: "markdown",
    },
  ];
}
