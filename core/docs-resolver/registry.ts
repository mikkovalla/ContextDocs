const FETCH_TIMEOUT = 12000;
const metadataCache = new Map<string, NpmPackageMetadata>();

export type NpmPackageMetadata = {
  repositoryUrl?: string;
  homepageUrl?: string;
  docsUrl?: string;
  readme?: string;
};

function sanitizeSiteUrl(raw?: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;

  try {
    const parsed = new URL(raw);
    parsed.hash = "";

    const path = parsed.pathname.toLowerCase();
    const host = parsed.hostname.toLowerCase();

    if (path.includes("/issues") || path.includes("/pull")) {
      return undefined;
    }

    if (host === "github.com" && path.split("/").filter(Boolean).length <= 2) {
      return undefined;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function sanitizeRepoUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw
    .replace(/^git\+/, "")
    .replace(/^git:/, "https:")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
}

export async function fetchNpmPackageMetadata(
  packageName: string,
): Promise<NpmPackageMetadata | null> {
  const cached = metadataCache.get(packageName);
  if (cached) {
    return cached;
  }

  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  let data = await fetchWithTimeout(registryUrl);

  if (!data) {
    data = await fetchWithTimeout(registryUrl);
  }

  if (!data) return null;

  const latestTag = data["dist-tags"]?.latest;
  const latest = latestTag ? data.versions?.[latestTag] : null;

  const repositoryUrl = sanitizeRepoUrl(
    latest?.repository?.url ?? data.repository?.url,
  );

  const homepageUrl = sanitizeSiteUrl(latest?.homepage ?? data.homepage);
  const docsUrl = sanitizeSiteUrl(
    latest?.docs ??
      latest?.homepage ??
      data.homepage ??
      data?.["dist-tags"]?.docs,
  );

  const metadata: NpmPackageMetadata = {
    repositoryUrl,
    homepageUrl,
    docsUrl,
    readme: typeof data.readme === "string" ? data.readme : undefined,
  };

  metadataCache.set(packageName, metadata);
  return metadata;
}
