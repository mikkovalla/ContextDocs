import { join } from "node:path";
import { ParsedDependency, StackAnalysisResult } from "../../types";
import { analyzeNpm } from "./npm";

function dedupeDependencies(dependencies: ParsedDependency[]): ParsedDependency[] {
  const uniqueDeps = new Map<string, ParsedDependency>();

  for (const dep of dependencies) {
    uniqueDeps.set(`${dep.ecosystem}-${dep.name}`, dep);
  }

  return Array.from(uniqueDeps.values());
}

export async function analyzeProjectStack(
  projectRoot: string = process.cwd(),
): Promise<StackAnalysisResult> {
  const result: StackAnalysisResult = {
    ecosystemsFound: [],
    dependencies: [],
  };

  const packageJsonPath = join(projectRoot, "package.json");
  const packageJson = Bun.file(packageJsonPath);

  if (await packageJson.exists()) {
    result.ecosystemsFound.push("npm");
    const deps = await analyzeNpm(await packageJson.text());
    result.dependencies.push(...deps);
  }

  result.dependencies = dedupeDependencies(result.dependencies);
  return result;
}
