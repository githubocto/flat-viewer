import React from "react";
import { RouteComponentProps, useHistory } from "react-router-dom";
import formatDistance from "date-fns/formatDistance";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import { useQueryParam, NumberParam, StringParam } from "use-query-params";

import {
  BookmarkIcon,
  CommitIcon,
  LinkExternalIcon,
  RepoIcon,
} from "@primer/octicons-react";
import { debounce } from "lodash";
import { Title } from "react-head";

import { useCommits, useGetFiles } from "../hooks";
import { Repo } from "../types";

import { JSONDetail } from "./json-detail-container";
import { getFiltersAsString, GridState, parseFlatCommitMessage } from "../lib";
import { Picker } from "./picker";
import { FilePicker } from "./file-picker";
import { DisplayCommit } from "./display-commit";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;
  const currentGridUrlParamString = React.useRef("");
  const [filename, setFilename] = useQueryParam("filename", StringParam);
  const [selectedSha, setSelectedSha] = useQueryParam("sha", StringParam);

  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

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
  const { data: files } = useGetFiles(
    { owner, name },
    {
      onSuccess: (data) => {
        if (!data.length) return;
        setFilename(data[0]);
      },
    }
  );
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
      // history.push({
      //   search: currentGridUrlParamString.current,
      // });
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
      filename,
    });
    updateUrlParams();
  }, [
    selectedSha,
    gridStateFiltersString,
    gridStateSortString,
    gridState.stickyColumnName,
    filename,
  ]);

  // Hook for fetching commits, once we've determined this is a Flat repo.
  const { data: commits = [] } = useCommits(
    { owner, name, filename },
    {
      enabled: Boolean(filename),
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

              // history.push({
              //   search: qs.stringify({ sha: mostRecentCommitSha }),
              // });
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
  const dataSource = parsedCommit?.file?.source;

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
              className="hover:underline focus:underline bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 rounded text-white inline-flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              target="_blank"
              rel="noopener noreferrer"
              href={repoUrl}
            >
              <div className="flex items-center space-x-2">
                <RepoIcon />
                <div
                  className="overflow-ellipsis whitespace-nowrap overflow-hidden text-xs"
                  style={{
                    maxWidth: "min(30em, 100% - 1em)",
                  }}
                >
                  {owner}/{name}
                </div>
                <div className="opacity-50">
                  <LinkExternalIcon />
                </div>
              </div>
            </a>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-indigo-200">Data File</p>
          <FilePicker
            value={filename || ""}
            placeholder="Select a file"
            onChange={(newFilename) => {
              setFilename(newFilename);
              setGridState({
                filters: {},
                sort: [],
                stickyColumnName: undefined,
              });
            }}
            items={files || []}
            itemRenderer={(item) => (
              <span className="font-mono text-xs">{item}</span>
            )}
          />
        </div>
        {Boolean(filename) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-indigo-200">Commit</p>
            {commits && (
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
                      <DisplayCommit
                        message={commit?.commit.message}
                        author={commit?.commit.author?.email}
                        filename={filename}
                      />
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
                    <CommitIcon size={16} />
                    <div className="flex-1 truncate">
                      <DisplayCommit
                        message={
                          commits.find((commit) => commit.sha === sha)?.commit
                            .message
                        }
                        author={
                          commits.find((commit) => commit.sha === sha)?.commit
                            .author?.email
                        }
                        filename={filename}
                      />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        )}

        {!!dataSource && (
          <div className="space-y-2 min-w-0">
            <p className="text-xs font-medium text-indigo-200">Data source</p>
            <a
              className="font-mono hover:underline focus:underline bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 rounded text-white flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              href={dataSource}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className="flex-none">
                  <BookmarkIcon />
                </div>
                <div className="overflow-ellipsis whitespace-nowrap overflow-hidden text-xs">
                  {dataSource}
                </div>
                <div className="opacity-50">
                  <LinkExternalIcon />
                </div>
              </div>
            </a>
          </div>
        )}
      </div>
      <React.Fragment>
        {selectedSha && Boolean(filename) && (
          <JSONDetail
            key={selectedSha}
            filename={filename || ""}
            owner={owner as string}
            name={name as string}
            previousSha={selectedShaPrevious}
            sha={selectedSha}
            urlGridState={urlGridState}
            onGridStateChange={setGridState}
          />
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
