import { ParsedDependency } from "../../types";

export async function analyzeMaven(
  fileContent: string,
): Promise<ParsedDependency[]> {
  const deps: ParsedDependency[] = [];
  // Safe, fast regex extraction bypassing heavy XML parsers for v1
  const dependencyBlockRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  const groupIdRegex = /<groupId>([^<]+)<\/groupId>/;
  const artifactIdRegex = /<artifactId>([^<]+)<\/artifactId>/;
  const versionRegex = /<version>([^<]+)<\/version>/;

  let match;
  while ((match = dependencyBlockRegex.exec(fileContent)) !== null) {
    const block = match[1];
    const groupId = new RegExp(groupIdRegex).exec(block)?.[1];
    const artifactId = new RegExp(artifactIdRegex).exec(block)?.[1];
    const version = new RegExp(versionRegex).exec(block)?.[1];

    if (groupId && artifactId && version) {
      // Maven convention: groupId:artifactId
      deps.push({
        name: `${groupId}:${artifactId}`,
        version,
        ecosystem: "maven",
      });
    }
  }
  return deps;
}
