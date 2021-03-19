import { useQuery, UseQueryOptions, UseQueryResult } from "react-query";
import nprogress from "nprogress";

import {
  fetchCommits,
  fetchFlatYaml,
  fetchDataFile,
  FileParams,
  FileParamsWithSHA,
  listCommitsResponse,
} from "../api";
import { Repo } from "../types";
import React from "react";

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

export function useDataFile(
  params: FileParamsWithSHA,
  config?: UseQueryOptions<string>
) {
  return useQuery(["data", params], () => fetchDataFile(params), {
    retry: false,
    refetchOnWindowFocus: false,
    ...config,
  });
}

nprogress.configure({ showSpinner: false });

export function useProgressBar(result: UseQueryResult) {
  React.useEffect(() => {
    if (result.isLoading) {
      nprogress.start();
    } else if (result.isSuccess || result.isError) {
      nprogress.done();
    }
  }, [result]);
}
