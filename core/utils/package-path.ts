export function toPackageDirName(packageName: string): string {
  return packageName
    .replace(/^@/, "")
    .replaceAll("/", "__")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
}
