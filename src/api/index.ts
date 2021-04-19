import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import { Repo } from "../types";
import { csvParse } from "d3-dsv";

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

const ignoredFiles = ["package.json", "tsconfig.json"];
const ignoredFolders = [".vscode", ".github"];
const getFilesFromRes = (res: any) => {
  return res.tree
    .map((file: any) => file.path)
    .filter((path: string) => {
      const extension = path.split(".").pop() || "";
      const validExtensions = ["csv", "json"];
      return (
        validExtensions.includes(extension) &&
        !ignoredFiles.includes(path.split("/").slice(-1)[0]) &&
        !ignoredFolders.includes(path.split("/")[0])
      );
    });
};

function tryBranch(owner: string, name: string, branch: string) {
  return wretch()
    .url(
      `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`
    )
    .get()
    .notFound(() => {
      throw new Error("File not found");
    })
    .json((res) => {
      return getFilesFromRes(res);
    });
}

export async function fetchFilesFromRepo({ owner, name }: Repo) {
  const files = await Promise.any([
    tryBranch(owner, name, "master"),
    tryBranch(owner, name, "main"),
  ]);
  return files;
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
  const { name, owner, filename } = params;

  return wretch()
    .url(`https://api.github.com/repos/${owner}/${name}/commits`)
    .query({
      path: filename,
    })
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
  if (!filename) return;
  const fileType = filename.split(".").pop() || "";
  const validTypes = ["csv", "json"];
  if (!validTypes.includes(fileType)) return;

  return wretch()
    .url(
      `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filename}`
    )
    .get()
    .notFound(() => {
      throw new Error("Data file not found");
    })
    .text((res) => {
      const data = fileType === "csv" ? csvParse(res) : JSON.parse(res);
      const keys = Object.keys(data);

      const isObjectOfObjects =
        keys.length && !Object.values(data).find(Array.isArray);
      if (!isObjectOfObjects)
        return Array.isArray(data) ? data.filter(Boolean) : data;

      let parsedData = <any[]>[];
      keys.forEach((key) => {
        parsedData = [...parsedData, { ...data[key], id: key }];
      });
      return parsedData;
    });
}
