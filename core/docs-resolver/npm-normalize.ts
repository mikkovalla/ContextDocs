const ALIAS_MAP: Record<string, string> = {
  nextjs: "next",
  "next.js": "next",
  drizzle: "drizzle-orm",
  acernityui: "aceternity",
  aceternityui: "aceternity",
  "aceternity-ui": "aceternity",
  supabase: "supabase",
  nestjs: "nestjs",
};

export function normalizeNpmPackageName(packageName: string): string {
  const lower = packageName.toLowerCase().trim();

  if (lower.startsWith("@nestjs/")) {
    return "nestjs";
  }

  if (lower.startsWith("@supabase/")) {
    return "supabase";
  }

  return ALIAS_MAP[lower] ?? lower;
}

export function dedupePackageNames(packageNames: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const packageName of packageNames) {
    const normalized = normalizeNpmPackageName(packageName);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(packageName);
  }

  return deduped;
}
