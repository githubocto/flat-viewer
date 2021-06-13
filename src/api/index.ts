import flatten from "flat";
import wretch from "wretch";
import { Endpoints } from "@octokit/types";
import store from "store2";
import YAML from "yaml";

import { Repo } from "../types";
import { csvParse, tsvParse } from "d3-dsv";

export type listCommitsResponse =
  Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

const githubApiURL = `https://api.github.com`;
const cachedPat = store.get("flat-viewer-pat");

const githubWretch = cachedPat
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
      const validExtensions = ["csv", "tsv", "json", "yml", "yaml"];
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

const handleJSONOrGeoJSON = (res: string): any => {
  const parsedRes = JSON.parse(res)

  // Figure out if the parsed result is either
  // an array of GeoJSON points, or an object 
  // with type set to specific values and a features
  // property whose value is an array of GeoJSON points
  const GEOMETRY_TYPES = [
    "Point", "MultiPoint", "LineString", 
    "MultiLineString", "Polygon", "MultiPolygon",
  ] as const

  type Geometry = {
    type: (typeof GEOMETRY_TYPES)[number]
    coordinates: number[] | number[][]
  }

  type Feature = {
    type: "Feature"
    geometry: Geometry | null
    properties: Record<string, unknown> | null
    [key: string]: unknown
  }

  const isGeometry = (a: any) => GEOMETRY_TYPES.includes(a.type) && a.coordinates

  const isGeometryArray = (arr: any[]): arr is Geometry[] => {
    return Array.isArray(arr) && arr.every(isGeometry)
  }

  const isFeatureArray = (arr: any[]): arr is Feature[] => {
    return Array.isArray(arr) && arr.every(
      a => a.type === 'Feature' && 
      (a.geometry === null || isGeometry(a.geometry)) && 
      a.properties !== undefined
    )
  }

  const flattenFeature = (feature: Feature) => {
    return flatten(feature, { safe: true })
  }

  if (isFeatureArray(parsedRes)) {
    return parsedRes.map(flattenFeature)
  } 
  if (parsedRes.type === 'FeatureCollection') {
    const { features } = parsedRes
    if (features && isFeatureArray(features)) {
      return features.map(flattenFeature)
    }
  } else if (parsedRes.type === 'GeometryCollection') {
    const { geometries } = parsedRes
    if (geometries && isGeometryArray(geometries)) {
      return geometries
    }
  }

  return parsedRes
}

export function fetchDataFile(params: FileParamsWithSHA) {
  const { filename, name, owner, sha } = params;
  if (!filename) return [];
  const fileType = filename.split(".").pop() || "";
  const validTypes = ["csv", "tsv", "json", "geojson", "yml", "yaml"];
  if (!validTypes.includes(fileType)) return [];

  return wretch()
    .url(
      `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filename}`
    )
    .get()
    .notFound(() => {
      throw new Error("Data file not found");
    })
    .text((res) => {
      let data: any;
      try {
        if (fileType === "csv") {
          data = csvParse(res);
        } else if (fileType === "json" || fileType === "geojson") {
          data = handleJSONOrGeoJSON(res);
        } else if (fileType === "tsv") {
          data = tsvParse(res);
        } else if (fileType === "yml" || fileType === "yaml") {
          data = YAML.parse(res);
        } else {
          return [
            {
              invalidValue: stringifyValue(res),
            },
          ];
        }
      } catch (e) {
        console.log(e);
        return [
          {
            invalidValue: stringifyValue(res),
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
        !Object.values(data).find(
          (d) => typeof d !== "object" || Array.isArray(d)
        );

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
    });
}

const stringifyValue = (data: any) => {
  if (typeof data === "object") return JSON.stringify(data, undefined, 2);
  return data.toString();
};
