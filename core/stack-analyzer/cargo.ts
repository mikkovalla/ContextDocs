import { ParsedDependency } from "../../types";

export async function analyzeCargo(
  fileContent: string,
): Promise<ParsedDependency[]> {
  const deps: ParsedDependency[] = [];
  // Very basic regex to catch `crate = "1.0"` or `crate = { version = "1.0" }`
  const regex =
    /^([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{.*version\s*=\s*"([^"]+)".*\})/gm;

  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    const name = match[1];
    const version = match[2] || match[3];
    if (name && version) {
      deps.push({ name, version, ecosystem: "cargo" });
    }
  }
  return deps;
}
