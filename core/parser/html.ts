import * as cheerio from "cheerio";

export async function normalizeHtml(rawHtml: string, sourceUrl?: string): Promise<string> {
  const $ = cheerio.load(rawHtml);

  $("script, style, nav, footer, header, noscript, svg").remove();

  const title =
    $("h1").first().text().trim() ||
    $("title").first().text().trim() ||
    "Documentation";

  const text = $("main, article, body").text().replace(/\s+/g, " ").trim();
  const sourceLine = sourceUrl ? `Source: ${sourceUrl}\n\n` : "";

  return `# ${title}\n\n${sourceLine}${text}`.trim();
}
