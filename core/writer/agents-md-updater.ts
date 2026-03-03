import { join } from "node:path";
import { ResolvedTarget } from "../../types";
import { toPackageDirName } from "../utils/package-path";

const DOCBRAIN_START = "<!-- DOCBRAIN:START -->";
const DOCBRAIN_END = "<!-- DOCBRAIN:END -->";

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

  const sorted = [...targets].sort((a, b) =>
    a.packageName.localeCompare(b.packageName),
  );

  let block = `${DOCBRAIN_START}\n`;
  block += "## Local Documentation Indexes\n\n";
  block +=
    "Use local `.ai-docs` indexes first. Prefer retrieval-led reasoning over pretraining guesses.\n\n";

  for (const target of sorted) {
    const packageDir = toPackageDirName(target.packageName);
    block += `- ${target.packageName}: read \`${join(projectRoot, ".ai-docs", "npm", packageDir, "AGENTS_INDEX.min")}\` first.\n`;
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
