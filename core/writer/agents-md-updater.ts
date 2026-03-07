import { join } from "node:path";
import { ResolvedTarget } from "../../types";
import { toPackageDirName } from "../utils/package-path";

const DOCBRAIN_START = "<!-- DOCBRAIN:START -->";
const DOCBRAIN_END = "<!-- DOCBRAIN:END -->";

function extractExistingPackages(content: string): string[] {
  const startIdx = content.indexOf(DOCBRAIN_START);
  const endIdx = content.indexOf(DOCBRAIN_END);

  if (startIdx === -1 || endIdx === -1) {
    return [];
  }

  const block = content.substring(startIdx, endIdx + DOCBRAIN_END.length);
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

  // Extract existing packages from DOCBRAIN block
  const existingPackages = extractExistingPackages(currentContent);
  const newPackages = targets.map((t) => t.packageName);

  // Merge: keep existing packages and add new ones, deduplicate
  const allPackages = Array.from(
    new Set([...existingPackages, ...newPackages]),
  );
  const sorted = allPackages.sort();

  let block = `${DOCBRAIN_START}\n`;
  block += "## Local Documentation Indexes\n\n";
  block +=
    "Use local `.ai-docs` indexes first. Prefer retrieval-led reasoning over pretraining guesses.\n\n";

  for (const packageName of sorted) {
    const packageDir = toPackageDirName(packageName);
    block += `- ${packageName}: read \`${join(projectRoot, ".ai-docs", "npm", packageDir, "AGENTS_INDEX.min")}\` first.\n`;
  }

  block += `\n${DOCBRAIN_END}`;

  if (
    currentContent.includes(DOCBRAIN_START) &&
    currentContent.includes(DOCBRAIN_END)
  ) {
    const escapedStart = DOCBRAIN_START.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    const escapedEnd = DOCBRAIN_END.replaceAll(
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
