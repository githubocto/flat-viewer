import { useQuery, UseQueryOptions, UseQueryResult } from "react-query";
import nprogress from "nprogress";
import store from 'store2';
import {
  fetchCommits,
  fetchFlatYaml,
  fetchDataFile,
  FileParams,
  FileParamsWithSHA,
  listCommitsResponse,
  fetchFilesFromRepo,
  fetchOrgRepos,
  getUser,
} from "../api";
import { Repo, FlatDataTab, Repository } from "../types";
import React from "react";


export function useGetUserName() {
  const token = store.get("flat-viewer-pat")
  return useQuery(["user"], () => getUser(token), {
    retry: false,
    refetchOnWindowFocus: false,
  });
}
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
  config?: UseQueryOptions<FlatDataTab[]>
) {
  return useQuery(["data", params], async () => await fetchDataFile(params), {
    retry: false,
    refetchOnWindowFocus: false,
    ...config,
  });
}

nprogress.configure({ showSpinner: false });

export function useProgressBar(numFetching: number) {
  React.useEffect(() => {
    if (numFetching > 0) {
      nprogress.start();
    } else {
      nprogress.done();
    }
  }, [numFetching]);
}

export function useGetFiles(
  { owner, name }: Repo,
  config?: UseQueryOptions<string[]>
) {
  return useQuery(
    ["files", owner, name],
    () => fetchFilesFromRepo({ owner, name }),
    {
      retry: false,
      refetchOnWindowFocus: false,
      ...config,
    }
  );
}

export function useOrgFlatRepos(
  orgName: string,
  config?: UseQueryOptions<Repository[]>
) {
  return useQuery(["org", orgName], () => fetchOrgRepos(orgName), {
    retry: false,
    refetchOnWindowFocus: false,
    ...config,
  });
}
