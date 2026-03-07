import { join } from "node:path";
import { ResolvedTarget } from "../../types";
import { toPackageDirName } from "../utils/package-path";

const CONTEXTDOCS_START = "<!-- CONTEXTDOCS:START -->";
const CONTEXTDOCS_END = "<!-- CONTEXTDOCS:END -->";
const LEGACY_DOCBRAIN_START = "<!-- DOCBRAIN:START -->";
const LEGACY_DOCBRAIN_END = "<!-- DOCBRAIN:END -->";

function getBlockMarkers(content: string): { start: string; end: string } | null {
  if (
    content.includes(CONTEXTDOCS_START) &&
    content.includes(CONTEXTDOCS_END)
  ) {
    return { start: CONTEXTDOCS_START, end: CONTEXTDOCS_END };
  }

  if (
    content.includes(LEGACY_DOCBRAIN_START) &&
    content.includes(LEGACY_DOCBRAIN_END)
  ) {
    return { start: LEGACY_DOCBRAIN_START, end: LEGACY_DOCBRAIN_END };
  }

  return null;
}

function extractExistingPackages(content: string): string[] {
  const markers = getBlockMarkers(content);
  if (!markers) {
    return [];
  }

  const startIdx = content.indexOf(markers.start);
  const endIdx = content.indexOf(markers.end);

  if (startIdx === -1 || endIdx === -1) {
    return [];
  }

  const block = content.substring(startIdx, endIdx + markers.end.length);
  const packages: string[] = [];

  // Match lines like "- packageName: read `...` first."
  const regex = /^- ([^\s:]+):/gm;
  let match;
  while ((match = regex.exec(block)) !== null) {
    packages.push(match[1]);
  }

  return packages;
}

export async function updateAgentsMd(
  projectRoot: string,
  targets: ResolvedTarget[],
): Promise<void> {
  const agentsMdPath = join(projectRoot, "AGENTS.md");
  let currentContent = "";

  const file = Bun.file(agentsMdPath);
  if (await file.exists()) {
    currentContent = await file.text();
  } else {
    currentContent = "# AI Agent Instructions\n\n";
  }

  // Extract existing packages from CONTEXTDOCS block (or migrate the legacy DOCBRAIN block)
  const existingPackages = extractExistingPackages(currentContent);
  const newPackages = targets.map((t) => t.packageName);

  // Merge: keep existing packages and add new ones, deduplicate
  const allPackages = Array.from(
    new Set([...existingPackages, ...newPackages]),
  );
  const sorted = allPackages.sort();

  let block = `${CONTEXTDOCS_START}\n`;
  block += "## Local Documentation Indexes\n\n";
  block +=
    "Use local `.ai-docs` indexes first. Prefer retrieval-led reasoning over pretraining guesses.\n\n";

  for (const packageName of sorted) {
    const packageDir = toPackageDirName(packageName);
    block += `- ${packageName}: read \`${join(projectRoot, ".ai-docs", "npm", packageDir, "AGENTS_INDEX.min")}\` first.\n`;
  }

  block += `\n${CONTEXTDOCS_END}`;

  const markers = getBlockMarkers(currentContent);
  if (markers) {
    const escapedStart = markers.start.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    const escapedEnd = markers.end.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    const regex = new RegExp(String.raw`${escapedStart}[\s\S]*?${escapedEnd}`);
    currentContent = currentContent.replace(regex, block);
  } else {
    currentContent = `${currentContent.trim()}\n\n${block}\n`;
  }

  await Bun.write(agentsMdPath, `${currentContent.trim()}\n`);
}
