import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import { Repo } from "../types";

export type listCommitsResponse = Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

export function fetchFlatYaml(repo: Repo) {
  return wretch()
    .url(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/main/.github/workflows/flat.yaml`
    )
    .get()
    .notFound(() => {
      throw new Error("Flat YAML not found");
    })
    .text(() => {
      // TODO: Find out where data is being stored.
      return "data.json";
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
  const { filename, name, owner } = params;

  return wretch()
    .url(`https://api.github.com/repos/${owner}/${name}/commits`)
    .query({ path: filename })
    .get()
    .json<listCommitsResponse["data"]>((res: any) => {
      if (res.length === 0) {
        throw new Error("No commits for this file.");
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
