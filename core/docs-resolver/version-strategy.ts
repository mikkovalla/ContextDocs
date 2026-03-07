import { NpmVersionContext, ResolvedSourceCandidate } from "../../types";

const UNKNOWN_VERSION = "unknown";
const SEMVER_PATTERN =
  /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/;

export function analyzeNpmVersion(requestedVersion: string): NpmVersionContext {
  const normalizedVersion = requestedVersion.trim() || UNKNOWN_VERSION;
  const match = SEMVER_PATTERN.exec(normalizedVersion);

  if (!match) {
    return {
      requestedVersion,
      normalizedVersion,
      stability: "unknown",
      compatibilityTarget: "latest",
      reason:
        normalizedVersion === UNKNOWN_VERSION
          ? "No npm version was provided, so the resolver will use the best generally compatible stable documentation source."
          : `The version string "${normalizedVersion}" could not be normalized as semver, so the resolver will prefer broadly compatible stable docs.`,
    };
  }

  const major = Number.parseInt(match[1], 10);
  const minor = match[2] ? Number.parseInt(match[2], 10) : 0;
  const patch = match[3] ? Number.parseInt(match[3], 10) : 0;
  const prereleaseTag = match[4];
  const stability = prereleaseTag ? "prerelease" : "stable";
  const exactVersion = `${major}.${minor}.${patch}`;

  return {
    requestedVersion,
    normalizedVersion,
    exactVersion,
    major,
    minor,
    patch,
    prereleaseTag,
    stability,
    compatibilityTarget: `major:${major}`,
    reason: prereleaseTag
      ? `Detected prerelease version ${exactVersion}-${prereleaseTag}; prerelease documentation lanes should be preferred when available.`
      : `Detected stable version ${exactVersion}; stable documentation lanes for major ${major} should be preferred.`,
  };
}

export function evaluateCandidateCompatibility(
  candidate: ResolvedSourceCandidate,
  versionContext: NpmVersionContext,
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (candidate.supportedMajorVersions && candidate.supportedMajorVersions.length > 0) {
    if (versionContext.major === undefined) {
      score -= 5;
      reasons.push(
        `Candidate targets npm major versions ${candidate.supportedMajorVersions.join(", ")}, but the dependency version is unknown.`,
      );
    } else if (candidate.supportedMajorVersions.includes(versionContext.major)) {
      score += 40;
      reasons.push(`Candidate explicitly matches requested major ${versionContext.major}.`);
    } else {
      score -= 40;
      reasons.push(
        `Candidate targets npm major versions ${candidate.supportedMajorVersions.join(", ")}, which does not match requested major ${versionContext.major}.`,
      );
    }
  } else {
    reasons.push("Candidate is not pinned to a specific npm major version.");
  }

  const docStability = candidate.docStability ?? "any";
  if (docStability === "stable") {
    if (versionContext.stability === "stable") {
      score += 10;
      reasons.push("Stable docs match the detected stable dependency release.");
    } else if (versionContext.stability === "prerelease") {
      score -= 4;
      reasons.push("Stable docs may lag the detected prerelease dependency.");
    } else {
      reasons.push("Stable docs are a safe fallback because dependency stability is unknown.");
    }
  } else if (docStability === "prerelease") {
    if (versionContext.stability === "prerelease") {
      score += 12;
      reasons.push("Prerelease docs match the detected prerelease dependency.");
    } else {
      score -= 25;
      reasons.push("Prerelease docs are deprioritized for non-prerelease dependency versions.");
    }
  } else {
    reasons.push("Candidate has no declared doc stability constraint.");
  }

  return {
    score,
    reason: reasons.join(" "),
  };
}