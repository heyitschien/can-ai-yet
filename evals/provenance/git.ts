import { execSync } from "node:child_process";

export type GitProvenance = {
  sha: string;
  dirty: boolean;
};

export function gitProvenance(): GitProvenance {
  try {
    const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim().length > 0;
    if (!/^[0-9a-f]{40}$/.test(sha)) return { sha: "uncommitted", dirty: true };
    return { sha, dirty };
  } catch {
    return { sha: "uncommitted", dirty: true };
  }
}

export function gitSha(): string {
  return gitProvenance().sha;
}
