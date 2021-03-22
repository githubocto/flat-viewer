import React from "react";
import { RouteComponentProps, Link, useHistory } from "react-router-dom";
import formatDistance from "date-fns/formatDistance";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import { CommitIcon, RepoIcon } from "@primer/octicons-react";

import { useCommits, useFlatYaml } from "../hooks";
import { Repo } from "../types";

import Glass from "../glass.svg";

import { JSONDetail } from "./json-detail-container";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { parseFlatCommitMessage } from "../lib";
import { Picker } from "./picker";
import { DisplayCommit } from "./display-commit";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;

  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

  const [selectedSha, setSelectedSha] = React.useState<string>(
    (parsedQueryString?.sha as string) || ""
  );

  React.useEffect(() => {
    if (selectedSha) {
      const currentQueryString = qs.parse(history.location.search);
      history.push({
        search: qs.stringify({ sha: selectedSha, key: currentQueryString.key }),
      });
    }
  }, [selectedSha]);

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
      <Toaster position="bottom-left" />
      <div className="bg-indigo-600 flex p-4 space-x-4">
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
                  disclosureClass="appearance-none bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 px-2 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                      <span className="block truncate">
                        <DisplayCommit
                          message={
                            commits.find((commit) => commit.sha === sha)?.commit
                              .message
                          }
                        />
                      </span>
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
          />
        )}
        {yamlQueryStatus === "error" && (
          <ErrorState img={Glass} alt="Magnifying glass icon">
            Hmm, we couldn't load any Flat data from this repository. <br /> Are
            you sure it has a valid Flat action in it?
          </ErrorState>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
