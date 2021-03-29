import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import { Repo } from "../types";

export type listCommitsResponse = Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

export async function fetchFlatYaml(repo: Repo) {
  let res;
  try {
    res = await fetchFile(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/main/.github/workflows/flat.yaml`
    );
  } catch (e) {
    try {
      res = await fetchFile(
        `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/main/.github/workflows/flat.yml`
      );
    } catch (e) {
      throw new Error("Flat YAML not found");
    }
  }
  return res && res.length > 0;
}
export function fetchFile(url: string) {
  return wretch()
    .url(url)
    .get()
    .notFound(() => {
      throw new Error("File not found");
    })
    .text((res) => {
      return res;
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
