import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import { Repo } from "../types";

export type listCommitsResponse = Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

export function fetchFlatYaml(repo: Repo) {
  // Check if flat.yml exists!
  return wretch()
    .url(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/main/.github/workflows/flat.yaml`
    )
    .get()
    .notFound(() => {
      throw new Error("Flat YAML not found");
    })
    .text((yaml) => {
      return yaml.length > 0;
    });
}

export interface FileParams {
  filename?: string;
  owner: string;
  name: string;
}

export interface FileParamsWithSHA extends FileParams {
  sha: string;
}

export function fetchCommits(params: FileParams) {
  const { name, owner } = params;

  return wretch()
    .url(`https://api.github.com/repos/${owner}/${name}/commits`)
    .query({ author: "flat-data@users.noreply.github.com" })
    .get()
    .json<listCommitsResponse["data"]>((res: any) => {
      if (res.length === 0) {
        throw new Error("No commits...");
      }

      return res;
    });
}

export function fetchDataFile(params: FileParamsWithSHA) {
  const { filename, name, owner, sha } = params;
  return wretch()
    .url(
      `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filename}`
    )
    .get()
    .notFound(() => {
      throw new Error("Data file not found");
    })
    .text();
}
