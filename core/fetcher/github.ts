import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import simpleGit from "simple-git";
import { RawDocFile, ResolvedSourceCandidate } from "../../types";

const MARKDOWN_EXTENSIONS = [".md", ".mdx", ".mdoc"];

function parseGitHubTreeUrl(url: string) {
  const regex =
    /^https:\/\/github\.com\/([^/]+\/[^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?\/?$/;
  const match = regex.exec(url);

  if (!match) {
    throw new Error(`Invalid GitHub tree URL: ${url}`);
  }

  return {
    repo: match[1],
    branch: match[2] ?? "main",
    subPath: match[3] ?? "",
  };
}

async function walkMarkdownFiles(dir: string, results: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkMarkdownFiles(fullPath, results);
      continue;
    }

    if (MARKDOWN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

function matchesCandidatePathRules(
  relativePath: string,
  candidate: ResolvedSourceCandidate,
): boolean {
  const normalized = relativePath.replaceAll("\\", "/");

  if (/(^|\/)(blog|community|changelog|releases|news)\//i.test(normalized)) {
    return false;
  }

  if (candidate.includePathPrefixes && candidate.includePathPrefixes.length > 0) {
    const matchesInclude = candidate.includePathPrefixes.some((prefix) =>
      normalized
        .toLowerCase()
        .startsWith(prefix.replace(/^\/+/, "").toLowerCase()),
    );

    if (!matchesInclude) {
      return false;
    }
  }

  if (candidate.excludePathPatterns && candidate.excludePathPatterns.length > 0) {
    const excluded = candidate.excludePathPatterns.some((pattern) =>
      new RegExp(pattern, "i").test(normalized),
    );

    if (excluded) {
      return false;
    }
  }

  return true;
}

export async function fetchFromGitHubTree(
  candidate: ResolvedSourceCandidate,
): Promise<RawDocFile[]> {
  const { repo, branch, subPath } = parseGitHubTreeUrl(candidate.url);

  const tempDir = await mkdtemp(join(tmpdir(), "docbrain-github-"));
  const cloneUrl = `https://github.com/${repo}.git`;

  try {
    const git = simpleGit();
    await git.clone(cloneUrl, tempDir, [
      "--depth",
      "1",
      "--branch",
      branch,
      "--single-branch",
    ]);

    const basePath = join(tempDir, subPath);
    const baseStat = await stat(basePath);

    if (!baseStat.isDirectory()) {
      throw new Error(`GitHub path is not a directory: ${candidate.url}`);
    }

    const markdownFiles = await walkMarkdownFiles(basePath);
    const files: RawDocFile[] = [];

    for (const filePath of markdownFiles) {
      const rel = relative(basePath, filePath);

      if (!matchesCandidatePathRules(rel, candidate)) {
        continue;
      }

      const content = await readFile(filePath, "utf8");
      files.push({
        relativePath: rel,
        content,
        sourceUrl: candidate.url,
        contentType: filePath.endsWith(".mdx") ? "mdx" : "markdown",
      });
    }

    return files;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
