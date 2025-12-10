import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface RepoFile {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export async function getRepoFiles(owner: string, repo: string): Promise<RepoFile[]> {
  try {
    // Try 'main' branch first
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: "main",
      recursive: "true",
    });
    return data.tree.filter((item) => item.type === "blob");
  } catch {
    try {
      // Fallback to 'master' branch
      const { data } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "master",
        recursive: "true",
      });
      return data.tree.filter((item) => item.type === "blob");
    } catch {
      console.error("Error fetching repo tree");
      throw new Error("Could not fetch repository files. Make sure the repository is public and the branch is main or master.");
    }
  }
}

export async function getFileContent(owner: string, repo: string, file_sha: string): Promise<string> {
  const { data } = await octokit.rest.git.getBlob({
    owner,
    repo,
    file_sha,
  });
  // Content is base64 encoded
  return Buffer.from(data.content, "base64").toString("utf-8");
}
