import * as cheerio from "cheerio";

const BLOCK_TAGS = new Set([
  "article",
  "aside",
  "blockquote",
  "body",
  "details",
  "div",
  "figure",
  "footer",
  "header",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
]);

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function detectCodeLanguage(node: any, $: cheerio.CheerioAPI): string {
  const className =
    $(node).attr("class") ??
    $(node).find("code").first().attr("class") ??
    "";
  const match = /(language|lang)-([a-z0-9_-]+)/i.exec(className);
  return match?.[2]?.toLowerCase() ?? "";
}

function renderInlineNode(node: any, $: cheerio.CheerioAPI): string {
  if (node.type === "text") {
    return collapseWhitespace(node.data ?? "");
  }

  if (node.type !== "tag") {
    return "";
  }

  const tag = (node.name ?? "").toLowerCase();
  const text = renderInlineChildren($(node).contents().toArray(), $);

  switch (tag) {
    case "a": {
      const href = $(node).attr("href");
      if (!href) return text;
      return text ? `[${text}](${href})` : href;
    }
    case "strong":
    case "b":
      return text ? `**${text}**` : "";
    case "em":
    case "i":
      return text ? `_${text}_` : "";
    case "code":
      return text ? `\`${text.replace(/`/g, "\\`")}\`` : "";
    case "br":
      return "  \n";
    case "img": {
      const alt = collapseWhitespace($(node).attr("alt") ?? "");
      return alt ? `![${alt}]()` : "";
    }
    default:
      return text;
  }
}

function renderInlineChildren(nodes: any[], $: cheerio.CheerioAPI): string {
  return collapseWhitespace(
    nodes
      .map((node) => renderInlineNode(node, $))
      .join(" ")
      .replace(/\s{2,}/g, " "),
  );
}

function hasBlockChildren(node: any, $: cheerio.CheerioAPI): boolean {
  return $(node)
    .contents()
    .toArray()
    .some(
      (child) =>
        child.type === "tag" &&
        BLOCK_TAGS.has((child.name ?? "").toLowerCase()),
    );
}

function indentLines(value: string, prefix: string): string {
  return value
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : prefix.trimEnd()))
    .join("\n");
}

function renderTable(node: any, $: cheerio.CheerioAPI): string {
  const rows = $(node)
    .find("tr")
    .toArray()
    .map((row) =>
      $(row)
        .children("th, td")
        .toArray()
        .map((cell) =>
          escapeTableCell(
            renderInlineChildren($(cell).contents().toArray(), $) || " ",
          ),
        ),
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) {
    return "";
  }

  const [firstRow, ...restRows] = rows;
  const header = firstRow;
  const bodyRows = restRows.length > 0 ? restRows : [firstRow];
  const divider = header.map(() => "---");

  return [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...bodyRows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function renderList(
  node: any,
  $: cheerio.CheerioAPI,
  depth: number,
  ordered: boolean,
): string[] {
  return $(node)
    .children("li")
    .toArray()
    .flatMap((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : "- ";
      const indent = "  ".repeat(depth);
      const childNodes = $(item).contents().toArray();
      const inlineNodes = childNodes.filter(
        (child) =>
          !(
            child.type === "tag" &&
            ["ul", "ol", "pre", "table", "blockquote"].includes(
              (child.name ?? "").toLowerCase(),
            )
          ),
      );
      const nestedNodes = childNodes.filter(
        (child) =>
          child.type === "tag" &&
          ["ul", "ol", "pre", "table", "blockquote"].includes(
            (child.name ?? "").toLowerCase(),
          ),
      );
      const firstLine = renderInlineChildren(inlineNodes, $) || "Item";
      const lines = [`${indent}${prefix}${firstLine}`];

      for (const nestedNode of nestedNodes) {
        const nestedBlocks = renderBlockNode(nestedNode, $, depth + 1);
        for (const nestedBlock of nestedBlocks) {
          lines.push(indentLines(nestedBlock, `${indent}  `));
        }
      }

      return lines;
    });
}

function renderBlockNode(
  node: any,
  $: cheerio.CheerioAPI,
  depth = 0,
): string[] {
  if (node.type === "text") {
    const text = collapseWhitespace(node.data ?? "");
    return text ? [text] : [];
  }

  if (node.type !== "tag") {
    return [];
  }

  const tag = (node.name ?? "").toLowerCase();

  if (/^h[1-6]$/.test(tag)) {
    const level = Number.parseInt(tag.slice(1), 10);
    const text = renderInlineChildren($(node).contents().toArray(), $);
    return text ? [`${"#".repeat(level)} ${text}`] : [];
  }

  switch (tag) {
    case "p": {
      const text = renderInlineChildren($(node).contents().toArray(), $);
      return text ? [text] : [];
    }
    case "pre": {
      const language = detectCodeLanguage(node, $);
      const codeNode = $(node).find("code").first();
      const codeText = (codeNode.length > 0 ? codeNode.text() : $(node).text())
        .replace(/\r\n/g, "\n")
        .trimEnd();
      if (!codeText) return [];
      return [`\`\`\`${language}\n${codeText}\n\`\`\``];
    }
    case "ul":
      return renderList(node, $, depth, false);
    case "ol":
      return renderList(node, $, depth, true);
    case "blockquote": {
      const rendered =
        renderBlockChildren($(node).contents().toArray(), $, depth + 1).join(
          "\n\n",
        ) || renderInlineChildren($(node).contents().toArray(), $);
      return rendered ? [indentLines(rendered, "> ")] : [];
    }
    case "table": {
      const table = renderTable(node, $);
      return table ? [table] : [];
    }
    case "hr":
      return ["---"];
    default: {
      if (hasBlockChildren(node, $)) {
        return renderBlockChildren($(node).contents().toArray(), $, depth);
      }

      const text = renderInlineChildren($(node).contents().toArray(), $);
      return text ? [text] : [];
    }
  }
}

function renderBlockChildren(
  nodes: any[],
  $: cheerio.CheerioAPI,
  depth = 0,
): string[] {
  return nodes.flatMap((node) => renderBlockNode(node, $, depth));
}

function injectSourceLine(markdown: string, sourceUrl: string): string {
  if (!markdown.startsWith("# ")) {
    return `${markdown}\n\nSource: ${sourceUrl}`.trim();
  }

  const firstLineBreak = markdown.indexOf("\n");
  if (firstLineBreak === -1) {
    return `${markdown}\n\nSource: ${sourceUrl}`;
  }

  const heading = markdown.slice(0, firstLineBreak);
  const remainder = markdown.slice(firstLineBreak + 1).trim();
  return `${heading}\n\nSource: ${sourceUrl}\n\n${remainder}`.trim();
}

export async function normalizeHtml(rawHtml: string, sourceUrl?: string): Promise<string> {
  const $ = cheerio.load(rawHtml);

  $("script, style, nav, footer, header, noscript, svg, iframe").remove();

  const root = $("main, article, [role='main'], body").first();
  const title = collapseWhitespace(
    $("h1").first().text() || $("title").first().text() || "Documentation",
  );
  const renderedBlocks = renderBlockChildren(
    (root.length > 0 ? root : $("body")).contents().toArray(),
    $,
  );
  let markdown = cleanMarkdown(renderedBlocks.join("\n\n"));

  if (!markdown.startsWith("# ")) {
    markdown = cleanMarkdown(`# ${title}\n\n${markdown}`);
  }

  if (sourceUrl) {
    markdown = injectSourceLine(markdown, sourceUrl);
  }

  return cleanMarkdown(markdown);
}
