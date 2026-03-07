import { Command } from "commander";
import { mkdir, rm } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import ora from "ora";
import pc from "picocolors";

import {
  ParsedDependency,
  RawDocFile,
  ResolvedTarget,
  SourceManifest,
  SourcePriority,
} from "../types";
import { resolveDocsTargets } from "../core/docs-resolver/resolver";
import { fetchDocumentation } from "../core/fetcher";
import { normalizeHtml } from "../core/parser/html";
import { normalizeMarkdown } from "../core/parser/markdown";
import {
  dedupePackageNames,
  normalizeNpmPackageName,
} from "../core/docs-resolver/npm-normalize";
import { analyzeProjectStack } from "../core/stack-analyzer/normalize";
import { generateMinifiedIndex } from "../core/structural-minifier/index-writer";
import { toPackageDirName } from "../core/utils/package-path";
import { updateAgentsMd } from "../core/writer/agents-md-updater";

const VALID_PRIORITIES: SourcePriority[] = ["llms", "github", "crawl"];

type InstallOptions = {
  nonInteractive?: boolean;
  packages?: string;
  sourcePriority?: SourcePriority;
};

function sourceKey(candidate: { kind: string; url: string }): string {
  return `${candidate.kind}|${candidate.url}`;
}

function buildSelectedSourceReason(
  target: ResolvedTarget,
  selectedSource: ResolvedTarget["selectedSource"],
  fetchedFileCount: number,
): string {
  const ranking = target.sourceRanking.find(
    (item) => sourceKey(item) === sourceKey(selectedSource),
  );
  const usedFallback =
    sourceKey(selectedSource) !== sourceKey(target.selectedSource);
  const parts: string[] = [];

  if (usedFallback) {
    parts.push(
      "A higher-ranked documentation source failed fetch or quality checks, so the resolver used the next viable candidate.",
    );
  }

  if (ranking) {
    parts.push(ranking.reason);
  }

  if (fetchedFileCount === 0) {
    parts.push("No candidate ultimately produced usable documentation files.");
  }

  return parts.join(" ").trim();
}

function buildManifest(
  target: ResolvedTarget,
  selectedSource: ResolvedTarget["selectedSource"],
  attempts: SourceManifest["attempts"],
  fetchedFileCount: number,
): SourceManifest {
  return {
    packageName: target.packageName,
    normalizedName: target.normalizedName,
    compositionType: target.compositionType,
    selectedSource,
    selectedSourceReason: buildSelectedSourceReason(
      target,
      selectedSource,
      fetchedFileCount,
    ),
    sourceCandidates: target.sourceCandidates,
    sourceRanking: target.sourceRanking,
    versionContext: target.versionContext,
    attempts,
    fetchedFileCount,
    generatedAt: new Date().toISOString(),
  };
}

function sanitizeRelativePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  const withoutTraversal = normalized
    .split("/")
    .filter((segment) => segment !== ".." && segment.length > 0)
    .join("/");
  return withoutTraversal.length > 0 ? withoutTraversal : "doc.md";
}

function ensureMarkdownExtension(relativePath: string): string {
  const ext = extname(relativePath).toLowerCase();
  if (ext === ".md") return relativePath;
  if (ext === ".mdx" || ext === ".txt" || ext === ".html" || ext === ".json") {
    return `${relativePath.slice(0, -ext.length)}.md`;
  }
  if (!ext) return `${relativePath}.md`;
  return `${relativePath}.md`;
}

async function normalizeFetchedFile(file: RawDocFile): Promise<string> {
  if (file.contentType === "html") {
    return normalizeHtml(file.content, file.sourceUrl);
  }

  if (file.contentType === "json") {
    return `# JSON Payload\n\nSource: ${file.sourceUrl}\n\n\`\`\`json\n${file.content}\n\`\`\``;
  }

  if (file.contentType === "text") {
    return `# Text Snapshot\n\nSource: ${file.sourceUrl}\n\n\`\`\`text\n${file.content}\n\`\`\``;
  }

  return normalizeMarkdown(file.content);
}

function uniqueDepsByNormalizedName(dependencies: ParsedDependency[]): ParsedDependency[] {
  const map = new Map<string, ParsedDependency>();
  for (const dep of dependencies) {
    const normalized = normalizeNpmPackageName(dep.name);
    if (!map.has(normalized)) {
      map.set(normalized, dep);
    }
  }
  return Array.from(map.values());
}

function depsFromPackageCsv(csv: string): ParsedDependency[] {
  const names = csv
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return dedupePackageNames(names).map((name) => ({
    name,
    version: "unknown",
    ecosystem: "npm",
  }));
}

async function promptForDependencySelection(
  dependencies: ParsedDependency[],
): Promise<ParsedDependency[]> {
  if (dependencies.length === 0) {
    return [];
  }

  console.log("\nSelect packages to fetch docs for (comma-separated numbers, blank for all):");
  dependencies.forEach((dep, index) => {
    console.log(`  ${index + 1}. ${dep.name} (${dep.version})`);
  });

  const rl = createInterface({ input, output });

  try {
    const answer = (await rl.question("Selection: ")).trim();

    if (!answer) {
      return dependencies;
    }

    const indexes = answer
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10) - 1)
      .filter((index) => Number.isInteger(index) && index >= 0 && index < dependencies.length);

    const selected = indexes.map((index) => dependencies[index]);
    return selected.length > 0 ? uniqueDepsByNormalizedName(selected) : dependencies;
  } finally {
    rl.close();
  }
}

export const installCommand = new Command("install")
  .description("Detect npm dependencies, fetch docs, and build local retrieval indexes")
  .option("--non-interactive", "Skip prompts and use all detected npm dependencies")
  .option("--packages <csv>", "Use explicit npm packages (comma-separated)")
  .option(
    "--source-priority <mode>",
    "Resolution priority: llms, github, or crawl",
    "llms",
  )
  .action(async (options: InstallOptions) => {
    const projectRoot = process.cwd();
    const spinner = ora("Analyzing package.json dependencies...").start();

    try {
      const priority = options.sourcePriority ?? "llms";
      if (!VALID_PRIORITIES.includes(priority)) {
        throw new Error(
          `Invalid --source-priority value \"${priority}\". Use llms, github, or crawl.`,
        );
      }

      let selectedDependencies: ParsedDependency[];

      if (options.packages) {
        selectedDependencies = depsFromPackageCsv(options.packages);
        spinner.text = `Using ${selectedDependencies.length} explicit packages...`;
      } else {
        const stack = await analyzeProjectStack(projectRoot);
        const npmDeps = uniqueDepsByNormalizedName(stack.dependencies);

        if (npmDeps.length === 0) {
          spinner.fail(pc.yellow("No npm dependencies found."));
          process.exit(0);
        }

        if (options.nonInteractive) {
          selectedDependencies = npmDeps;
        } else {
          spinner.stop();
          selectedDependencies = await promptForDependencySelection(npmDeps);
          spinner.start("Resolving documentation targets...");
        }
      }

      if (selectedDependencies.length === 0) {
        spinner.fail(pc.yellow("No packages selected."));
        process.exit(0);
      }

      spinner.text = `Resolving documentation targets for ${selectedDependencies.length} packages...`;
      const targets = await resolveDocsTargets(selectedDependencies, priority);

      if (targets.length === 0) {
        spinner.fail(pc.yellow("No documentation targets were resolved."));
        process.exit(0);
      }

      const successfulTargets: ResolvedTarget[] = [];
      const failures: string[] = [];

      for (const target of targets) {
        spinner.text = `Fetching docs for ${target.packageName} (${target.selectedSource.kind})...`;

        const fetchResult = await fetchDocumentation(target);
        const packageDir = toPackageDirName(target.packageName);
        const outputDir = join(projectRoot, ".ai-docs", "npm", packageDir);

        await rm(outputDir, { recursive: true, force: true });
        await mkdir(outputDir, { recursive: true });

        if (fetchResult.files.length === 0) {
          failures.push(target.packageName);

          const manifest = buildManifest(
            target,
            fetchResult.selectedSource,
            fetchResult.attempts,
            0,
          );

          await Bun.write(
            join(outputDir, "SOURCE_MANIFEST.json"),
            JSON.stringify(manifest, null, 2),
          );

          continue;
        }

        for (const file of fetchResult.files) {
          const normalized = await normalizeFetchedFile(file);
          const safeRelativePath = ensureMarkdownExtension(
            sanitizeRelativePath(file.relativePath),
          );
          const finalPath = join(outputDir, safeRelativePath);

          await mkdir(dirname(finalPath), { recursive: true });
          await Bun.write(finalPath, normalized);
        }

        const manifest = buildManifest(
          target,
          fetchResult.selectedSource,
          fetchResult.attempts,
          fetchResult.files.length,
        );

        await Bun.write(
          join(outputDir, "SOURCE_MANIFEST.json"),
          JSON.stringify(manifest, null, 2),
        );

        await generateMinifiedIndex(outputDir, target.packageName);
        successfulTargets.push(target);
      }

      if (successfulTargets.length > 0) {
        spinner.text = "Updating AGENTS.md...";
        await updateAgentsMd(projectRoot, successfulTargets);
      }

      if (failures.length > 0) {
        spinner.warn(
          pc.yellow(
            `Completed with partial failures. Failed packages: ${failures.join(", ")}`,
          ),
        );
      } else {
        spinner.succeed(
          pc.green(
            `Doc ingestion complete for ${successfulTargets.length} package(s).`,
          ),
        );
      }
    } catch (error) {
      spinner.fail(pc.red("Installation failed."));
      console.error(error);
      process.exit(1);
    }
  });
