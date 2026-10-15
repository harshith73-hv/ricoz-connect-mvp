import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const GITHUB_REPO = "harshith73-hv/ricoz-connect-mvp";

export type RepoCommit = { sha: string; message: string; author: string; url: string; date: string };

export const fetchRepoCommits = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/) }).parse(d))
  .handler(async ({ data }): Promise<{ commits: RepoCommit[]; note?: string }> => {
    const res = await fetch(`https://api.github.com/repos/${data.repo}/commits?per_page=10`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "RicozConnect" },
    });
    if (res.status === 409) return { commits: [], note: "The repository is empty — push a commit first." };
    if (!res.ok) return { commits: [], note: `GitHub returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (await res.json()) as any[];
    return {
      commits: list.map((c) => ({
        sha: String(c.sha).slice(0, 7),
        message: String(c.commit?.message ?? "").split("\n")[0] ?? "",
        author: String(c.commit?.author?.name ?? c.author?.login ?? "Someone"),
        url: String(c.html_url ?? ""),
        date: String(c.commit?.author?.date ?? ""),
      })),
    };
  });
