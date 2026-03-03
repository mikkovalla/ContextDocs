import { ParsedDependency } from "../../types";

function cleanVersion(rawVersion: unknown): string {
  if (typeof rawVersion !== "string") return "unknown";
  const cleaned = rawVersion.replaceAll(/^[~^<>=\s]+|[\s].*$/g, "").trim();
  return cleaned.length > 0 ? cleaned : "unknown";
}

export async function analyzeNpm(
  fileContent: string,
): Promise<ParsedDependency[]> {
  try {
    const pkg = JSON.parse(fileContent);
    const deps: ParsedDependency[] = [];

    const extract = (depObj: Record<string, unknown> = {}) => {
      for (const [name, version] of Object.entries(depObj)) {
        deps.push({
          name,
          version: cleanVersion(version),
          ecosystem: "npm",
        });
      }
    };

    extract(pkg.dependencies);
    extract(pkg.devDependencies);
    extract(pkg.peerDependencies);
    extract(pkg.optionalDependencies);

    return deps;
  } catch (error) {
    throw new Error("Failed to parse package.json", { cause: error });
  }
}
