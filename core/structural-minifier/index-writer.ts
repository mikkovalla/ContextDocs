import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { DenseFileMap } from "../../types";
import { extractDenseMap } from "./hierarchy-extractor";

const DOC_EXTENSIONS = [".md", ".mdx", ".txt"];

async function walkDocs(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDocs(fullPath, out);
      continue;
    }

    if (DOC_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      const fileStat = await stat(fullPath);
      if (fileStat.size > 0) {
        out.push(fullPath);
      }
    }
  }

  return out;
}

function formatEntry(entry: DenseFileMap): string {
  const headings =
    entry.headings.length > 0 ? entry.headings.join(" | ") : "(none)";
  const featureRefs =
    entry.featureRefs.length > 0 ? entry.featureRefs.join(" | ") : "(none)";
  const tags = entry.tags.length > 0 ? entry.tags.join(", ") : "(none)";

  return [
    `path: ${entry.filePath}`,
    `topic: ${entry.topic}`,
    `headings: ${headings}`,
    `features: ${featureRefs}`,
    `tags: ${tags}`,
    `hint: ${entry.hint}`,
  ].join("\n");
}

export async function generateMinifiedIndex(
  docsDir: string,
  packageName: string,
): Promise<string> {
  const docFiles = await walkDocs(docsDir);
  const map: DenseFileMap[] = [];

  for (const filePath of docFiles) {
    const content = await readFile(filePath, "utf8");
    const rel = relative(docsDir, filePath);
    map.push(await extractDenseMap(rel, content));
  }

  map.sort((a, b) => a.filePath.localeCompare(b.filePath));

  let output = "";
  output += `<docbrain_index package=\"${packageName}\">\n`;
  output +=
    "instruction: Read path entries, then open the file with the strongest topic/headings match.\n";
  output +=
    "instruction: Prefer API/reference pages for exact syntax and behavior.\n\n";

  for (const entry of map) {
    output += "---\n";
    output += `${formatEntry(entry)}\n`;
  }

  output += "</docbrain_index>\n";

  const indexPath = join(docsDir, "AGENTS_INDEX.min");
  await writeFile(indexPath, output, "utf8");
  return indexPath;
}
