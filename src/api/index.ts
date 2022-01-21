import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import store from "store2";
import YAML from "yaml";

import { Repo, Repository } from "../types";
import { csvParse, tsvParse } from "d3-dsv";

export type listCommitsResponse =
  Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

const githubApiURL = `https://api.github.com`;
const cachedPat = store.get("flat-viewer-pat");

let githubWretch = cachedPat
  ? wretch(githubApiURL).auth(`token ${cachedPat}`)
  : wretch(githubApiURL);

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
      const validExtensions = [
        "csv",
        "tsv",
        "json",
        "geojson",
        "topojson",
        "yml",
        "yaml",
      ];
      return (
        validExtensions.includes(extension) &&
        !ignoredFiles.includes(path.split("/").slice(-1)[0]) &&
        !ignoredFolders.includes(path.split("/")[0])
      );
    });
};

function tryBranch(owner: string, name: string, branch: string) {
  return githubWretch
    .url(`/repos/${owner}/${name}/git/trees/${branch}?recursive=1`)
    .get()
    .notFound((e) => {
      throw new Error("File not found");
    })
    .error(401, () => {
      // clear PAT
      store.remove("flat-viewer-pat");
      console.log("PAT expired");
      githubWretch = wretch(githubApiURL);
    })
    .error(403, (e: any) => {
      const message = JSON.parse(e.message).message;
      if (message.includes("API rate limit exceeded")) {
        throw new Error("Rate limit exceeded");
      }
      throw new Error(e);
    })
    .json((res) => {
      return getFilesFromRes(res);
    });
}

export async function fetchFilesFromRepo({ owner, name }: Repo) {
  try {
    const files = await tryBranch(owner, name, "main");
    if (typeof files !== "string") return files;
  } catch (e) {
    try {
      const files = await tryBranch(owner, name, "master");
      if (typeof files !== "string") return files;
    } catch (e) {
      if (e.message == "Rate limit exceeded") {
        throw new Error("Rate limit exceeded");
      }
      throw new Error(e);
    }
  }
}

export interface FileParams {
  filename?: string | null;
  owner: string;
  name: string;
}

export interface FileParamsWithSHA extends FileParams {
  sha: string;
}

export function fetchCommits(params: FileParams) {
  const { name, owner, filename } = params;

  return githubWretch
    .url(`/repos/${owner}/${name}/commits`)
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

export async function fetchDataFile(params: FileParamsWithSHA) {
  const { filename, name, owner, sha } = params;
  if (!filename) return [];
  const fileType = filename.split(".").pop() || "";
  const validTypes = [
    "csv",
    "tsv",
    "json",
    "geojson",
    "topojson",
    "yml",
    "yaml",
  ];
  if (!validTypes.includes(fileType)) return [];
  // const githubWretch = cachedPat
  //   ? wretch(
  //       `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filename}`
  //     ).auth(`token ${cachedPat}`)
  //   :

  let res;
  const text = await wretch(
    `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filename}`
  )
    .get()
    .notFound(async () => {
      if (cachedPat) {
        const data = await githubWretch
          .url(`/repos/${owner}/${name}/contents/${filename}`)
          .get()
          .json();
        const content = atob(data.content);
        return content;
      } else {
        throw new Error("Data file not found");
      }
    })
    .text();

  let data: any;
  try {
    if (fileType === "csv") {
      data = csvParse(text);
    } else if (
      ["geojson", "topojson"].includes(fileType) ||
      filename.endsWith(".geo.json")
    ) {
      data = JSON.parse(text);
      if (data.features) {
        const features = data.features.map((feature: any) => {
          let geometry = {} as Record<string, any>;
          Object.keys(feature?.geometry).forEach((key) => {
            geometry[`geometry.${key}`] = feature.geometry[key];
          });
          let properties = {} as Record<string, any>;
          Object.keys(feature?.properties).forEach((key) => {
            properties[`properties.${key}`] = feature.properties[key];
          });
          const { geometry: g, properties: p, ...restOfKeys } = feature;
          return { ...restOfKeys, ...geometry, ...properties };
        });
        // make features the first key of the object
        const { features: f, ...restOfData } = data;
        data = { features, ...restOfData };
      }
    } else if (fileType === "json") {
      data = JSON.parse(text);
    } else if (fileType === "tsv") {
      data = tsvParse(text);
    } else if (fileType === "yml" || fileType === "yaml") {
      data = YAML.parse(text);
    } else {
      return [
        {
          invalidValue: stringifyValue(text),
        },
      ];
    }
  } catch (e) {
    console.log(e);
    return [
      {
        invalidValue: stringifyValue(text),
      },
    ];
  }

  if (typeof data !== "object") {
    return [
      {
        invalidValue: stringifyValue(data),
      },
    ];
  }

  const isArray = Array.isArray(data);
  if (isArray) {
    return [
      {
        value: data,
      },
    ];
  }

  const keys = Object.keys(data);

  const isObjectOfObjects =
    keys.length &&
    !Object.values(data).find((d) => typeof d !== "object" || Array.isArray(d));

  if (!isObjectOfObjects)
    return keys.map((key) => {
      const value = data[key];
      if (!Array.isArray(value)) {
        return {
          key,
          invalidValue: stringifyValue(value),
        };
      }

      if (typeof value[0] === "string") {
        return {
          key,
          value: value.map((d) => ({ value: d })),
        };
      }

      return {
        key,
        value,
      };
    });

  let parsedData = <any[]>[];
  keys.forEach((key) => {
    parsedData = [...parsedData, { ...data[key], id: key }];
  });
  return [
    {
      value: parsedData,
    },
  ];
}

export async function fetchOrgRepos(orgName: string) {
  const res = await githubWretch
    .url(`/search/repositories`)
    .query({ q: `topic:flat-data org:${orgName}`, per_page: 100 })
    .get()
    .json();

  return res.items;
}

const stringifyValue = (data: any) => {
  if (typeof data === "object") return JSON.stringify(data, undefined, 2);
  return data.toString();
};
