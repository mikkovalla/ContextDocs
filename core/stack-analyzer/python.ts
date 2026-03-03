import { ParsedDependency } from "../../types";

export async function analyzeRequirementsTxt(
  fileContent: string,
): Promise<ParsedDependency[]> {
  const deps: ParsedDependency[] = [];
  // Matches "Flask==2.0.1", "requests>=2.25.1", "numpy~=1.21.0"
  // Captures the package name [1] and the version string [2]
  const regex = /^([a-zA-Z0-9_.-]+)\s*(?:==|>=|<=|~=)\s*([a-zA-Z0-9_.-]+)/gm;

  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    const name = match[1];
    const version = match[2];
    if (name && version) {
      // Correctly categorized as 'pypi'
      deps.push({ name, version, ecosystem: "pypi" });
    }
  }
  return deps;
}

export async function analyzePyProjectToml(
  fileContent: string,
): Promise<ParsedDependency[]> {
  const deps: ParsedDependency[] = [];
  // Basic regex to catch standard TOML dependency declarations like:
  // fastapi = "0.68.0"
  // pydantic = {version = "^1.8.0"}
  const regex =
    /^([a-zA-Z0-9_.-]+)\s*=\s*(?:"([^"]+)"|\{.*version\s*=\s*"([^"]+)".*\})/gm;

  // We only want to parse within dependency blocks to avoid capturing unrelated config
  const isInsideDepsBlock = (content: string) => {
    return (
      content.includes("[tool.poetry.dependencies]") ||
      content.includes("[project.dependencies]")
    );
  };

  if (!isInsideDepsBlock(fileContent)) return deps;

  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    const name = match[1];
    let version = match[2] || match[3];

    if (name && version) {
      // Strip Python-specific version modifiers (e.g., ^, ~)
      version = version.replaceAll(/[\^~]/g, "").trim();

      // Correctly categorized as 'pypi'
      deps.push({ name, version, ecosystem: "pypi" });
    }
  }
  return deps;
}
