import React from "react";
import { RouteComponentProps, useHistory } from "react-router-dom";
import formatDistance from "date-fns/formatDistance";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import { CommitIcon, RepoIcon } from "@primer/octicons-react";
import { debounce } from "lodash";
import { Title } from "react-head";

import { useCommits, useFlatYaml } from "../hooks";
import { Repo } from "../types";

import Glass from "../glass.svg";

import { JSONDetail } from "./json-detail-container";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { getFiltersAsString, GridState, parseFlatCommitMessage } from "../lib";
import { Picker } from "./picker";
import { DisplayCommit } from "./display-commit";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;
  const currentGridUrlParamString = React.useRef("");

  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

  const [selectedSha, setSelectedSha] = React.useState<string>(
    (parsedQueryString?.sha as string) || ""
  );

  const [gridState, setGridState] = React.useState<GridState>({
    filters: {},
    sort: [],
    stickyColumnName: undefined,
  });
  const [urlGridState, setUrlGridState] = React.useState<GridState>({
    filters: {},
    sort: [],
    stickyColumnName: undefined,
  });
  const updateGridStateFromFilters = () => {
    const splitFilters =
      // @ts-ignore
      decodeURI(parsedQueryString?.filters || "").split("&") || [];
    let filters = {};
    splitFilters.forEach((filter) => {
      const [key, value] = filter.split("=");
      if (!key || !value) return;
      const isArray = value?.split(",").length === 2;
      // @ts-ignore
      filters[key] = isArray ? value.split(",").map((d) => +d) : value;
    });
    // @ts-ignore
    const sort = decodeURIComponent(parsedQueryString?.sort || "")?.split(",");
    const stickyColumnName =
      typeof parsedQueryString?.stickyColumnName === "string"
        ? parsedQueryString?.stickyColumnName
        : "";
    setUrlGridState({ filters, sort, stickyColumnName });
  };
  React.useEffect(updateGridStateFromFilters, [selectedSha]);

  const gridStateFiltersString = getFiltersAsString(gridState.filters);
  const gridStateSortString = gridState.sort.join(",");

  const updateUrlParams = React.useCallback(
    debounce(() => {
      history.push({
        search: currentGridUrlParamString.current,
      });
    }, 1200),
    []
  );
  React.useEffect(() => {
    const currentQueryString = qs.parse(history.location.search);
    currentGridUrlParamString.current = qs.stringify({
      sha: selectedSha,
      key: currentQueryString.key,
      filters: gridStateFiltersString,
      sort: gridStateSortString,
      stickyColumnName: gridState.stickyColumnName,
    });
    updateUrlParams();
  }, [
    selectedSha,
    gridStateFiltersString,
    gridStateSortString,
    gridState.stickyColumnName,
  ]);

  // Hook for fetching flat YAML config
  const yamlQueryResult = useFlatYaml({ owner, name });
  const { data: isFlatRepo, status: yamlQueryStatus } = yamlQueryResult;

  // Hook for fetching commits, once we've determined this is a Flat repo.
  const { data: commits = [], status: commitQueryStatus } = useCommits(
    { owner, name },
    {
      enabled: isFlatRepo === true,
      onSuccess: (commits) => {
        const mostRecentCommitSha = commits[0].sha;

        if (commits.length > 0) {
          if (selectedSha) {
            if (commits.some((commit) => commit.sha === selectedSha)) {
              // noop
            } else {
              toast.error(
                "Hmm, we couldn't find a commit by that SHA. Reverting to the most recent commit.",
                {
                  duration: 4000,
                }
              );

              history.push({
                search: qs.stringify({ sha: mostRecentCommitSha }),
              });
              setSelectedSha(mostRecentCommitSha);
            }
          } else {
            setSelectedSha(mostRecentCommitSha);
          }
        }
      },
    }
  );

  const repoUrl = `https://github.com/${owner}/${name}`;

  const parsedCommit = selectedSha
    ? parseFlatCommitMessage(
        commits?.find((commit) => commit.sha === selectedSha)?.commit.message
      )
    : null;

  const selectedShaIndex = commits.findIndex((d) => d.sha === selectedSha);
  const selectedShaPrevious =
    selectedShaIndex !== -1
      ? (commits[selectedShaIndex + 1] || {}).sha
      : undefined;

  return (
    <React.Fragment>
      <Title>
        {owner}/{name} – Flat
      </Title>
      <Toaster position="bottom-left" />
      <div className="bg-indigo-600 lg:flex p-4 space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-indigo-200">Repository</p>
          <div className="font-mono text-sm text-white">
            <a
              className="hover:underline bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 rounded text-white inline-flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              target="_blank"
              rel="noopener noreferrer"
              href={repoUrl}
            >
              <div className="flex items-center space-x-2">
                <RepoIcon />
                <span className="text-xs">
                  {owner}/{name}
                </span>
              </div>
            </a>
          </div>
        </div>
        {yamlQueryStatus !== "error" && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-indigo-200">Commit</p>
            {yamlQueryStatus === "loading" ||
              (commitQueryStatus === "loading" && (
                <div className="w-48 h-4 skeleton"></div>
              ))}
            {yamlQueryStatus === "success" &&
              commitQueryStatus === "success" &&
              commits && (
                <Picker<string>
                  label="Choose a commit"
                  placeholder="Select a SHA"
                  onChange={setSelectedSha}
                  value={selectedSha}
                  items={commits.map((commit) => commit.sha)}
                  disclosureClass="appearance-none bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 px-2 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full lg:max-w-md"
                  itemRenderer={(sha) => {
                    const commit = commits.find((commit) => commit.sha === sha);
                    return (
                      <div className="flex flex-col space-y-1 text-xs">
                        <DisplayCommit message={commit?.commit.message} />
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-600">
                              {formatDistance(
                                new Date(commit?.commit.author?.date || ""),
                                new Date(),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  selectedItemRenderer={(sha) => (
                    <div className="flex items-center space-x-2">
                      <CommitIcon />
                      <div className="flex-1 truncate">
                        <DisplayCommit
                          message={
                            commits.find((commit) => commit.sha === sha)?.commit
                              .message
                          }
                        />
                      </div>
                    </div>
                  )}
                />
              )}
          </div>
        )}
      </div>
      <React.Fragment>
        {yamlQueryStatus === "loading" && <LoadingState />}
        {yamlQueryStatus === "success" && selectedSha && parsedCommit && (
          <JSONDetail
            key={selectedSha}
            filename={parsedCommit.file.name}
            owner={owner as string}
            name={name as string}
            previousSha={selectedShaPrevious}
            sha={selectedSha}
            urlGridState={urlGridState}
            onGridStateChange={setGridState}
          />
        )}
        {yamlQueryStatus === "error" && (
          <ErrorState img={Glass} alt="Magnifying glass icon">
            <p>
              Hmm, we couldn't tell if this is a Flat repository. <br />
              Your repo must be public and have a <code>flat.yaml</code> file in
              order to view your data!
            </p>
          </ErrorState>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
