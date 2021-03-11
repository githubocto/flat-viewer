import { useQuery, UseQueryOptions } from "react-query";
import { Endpoints } from "@octokit/types";

import {
  fetchCommits,
  fetchFlatYaml,
  fetchDataFile,
  FileParams,
  FileParamsWithSHA,
  listCommitsResponse,
} from "../api";
import { Repo } from "../types";

// Hooks
export function useFlatYaml(repo: Repo) {
  return useQuery(["flat-yaml", repo], () => fetchFlatYaml(repo), {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(repo.owner) && Boolean(repo.name),
  });
}

export function useCommits(
  params: FileParams,
  config: UseQueryOptions<listCommitsResponse["data"]>
) {
  return useQuery(["commits", params], () => fetchCommits(params), {
    retry: false,
    refetchOnWindowFocus: false,
    ...config,
  });
}

export function useDataFile(params: FileParamsWithSHA) {
  return useQuery(["data", params], () => fetchDataFile(params), {
    retry: false,
    refetchOnWindowFocus: false,
  });
}
