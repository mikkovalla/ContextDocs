import matter from "gray-matter";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { Node } from "unist";
import { SKIP, visit } from "unist-util-visit";

function stripMdxImports(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith("import ") && !line.trim().startsWith("export "))
    .join("\n");
}

function stripDecorativeHtmlLines(content: string): string {
  const lines = content.split("\n");
  const cleaned: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      cleaned.push(line);
      continue;
    }

    if (inCodeFence) {
      cleaned.push(line);
      continue;
    }

    const headingTagMatch = trimmed.match(
      /^<h([1-6])[^>]*>(.*?)<\/h\1>$/i,
    );

    if (headingTagMatch) {
      const depth = Number.parseInt(headingTagMatch[1], 10);
      const inner = headingTagMatch[2].replace(/<[^>]+>/g, "").trim();
      if (inner) {
        cleaned.push(`${"#".repeat(depth)} ${inner}`);
      }
      continue;
    }

    if (
      /^<\/?(div|span|p|br|hr|center|img|figure|figcaption)[^>]*>$/i.test(
        trimmed,
      )
    ) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n");
}

function remarkStripNoise() {
  return (tree: Node) => {
    visit(tree, (node: any, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.type === "image" || node.type === "imageReference") {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }

      if (node.type === "html") {
        if (/<(script|style|div|nav|svg|img|iframe)/i.test(node.value)) {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      }

      if (
        node.type === "link" &&
        node.children?.length === 1 &&
        node.children[0].type === "image"
      ) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
    });
  };
}

export async function normalizeMarkdown(rawContent: string): Promise<string> {
  try {
    const { data: frontmatter, content } = matter(rawContent);
    const cleaned = stripDecorativeHtmlLines(stripMdxImports(content));

    const file = await unified()
      .use(remarkParse)
      .use(remarkStripNoise)
      .use(remarkStringify, {
        bullet: "-",
        emphasis: "_",
        strong: "*",
        listItemIndent: "one",
      })
      .process(cleaned);

    let normalized = String(file);

    if (frontmatter.title && !normalized.trim().startsWith("# ")) {
      normalized = `# ${frontmatter.title}\n\n${normalized}`;
    }

    return normalized.replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return rawContent.replace(/\n{3,}/g, "\n\n").trim();
  }
}
