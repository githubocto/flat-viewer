import React, { useState } from "react";
import { RouteComponentProps } from "react-router";

import { useCommits, useFlatYaml, useProgressBar } from "../hooks";
import { Repo } from "../types";

import MeowEmoji from "../meow_huh.png";
import FlatLogo from "../flat.svg";

import { SHAPicker } from "./sha-picker";
import { JSONDetail } from "./json-detail-container";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const [selectedSha, setSelectedSha] = useState<string>();

  const { match } = props;
  const { owner, name } = match.params;

  // Hook for fetching flat YAML config
  const yamlQueryResult = useFlatYaml({ owner, name });
  const { data: filename, status: yamlQueryStatus } = yamlQueryResult;

  // Hook for fetching commits, once we've determined this is a Flat repo.
  const { data: commits, status: commitQueryStatus } = useCommits(
    { owner, name, filename },
    {
      enabled: Boolean(filename),
      onSuccess: (commits) => {
        if (commits.length > 0) {
          const mostRecentCommitSha = commits[0].sha;
          setSelectedSha(mostRecentCommitSha);
        }
      },
    }
  );

  useProgressBar(yamlQueryResult);

  const repoUrl = `https://github.com/${owner}/${name}`;

  return (
    <React.Fragment>
      <div className="bg-white border-b flex">
        <div className="w-16 h-16 p-2 border-r">
          <img className="w-full h-full" src={FlatLogo} alt="Flat Logo" />
        </div>
        <div className="flex items-center justify-center px-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Repository</p>
            <p className="font-mono text-sm">
              <a
                className="hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                href={repoUrl}
              >
                {owner}/{name}
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 border-l border-gray">
          {yamlQueryStatus === "loading" ||
            (commitQueryStatus === "loading" && (
              <div className="w-48 h-6 skeleton"></div>
            ))}
          {yamlQueryStatus === "success" &&
            commitQueryStatus === "success" &&
            commits && (
              <SHAPicker
                onChange={setSelectedSha}
                value={selectedSha}
                commits={commits}
              />
            )}
        </div>
      </div>
      <React.Fragment>
        {yamlQueryStatus === "loading" && <LoadingState />}
        {yamlQueryStatus === "success" && filename && selectedSha && (
          <JSONDetail
            filename={filename}
            owner={owner as string}
            name={name as string}
            sha={selectedSha}
          />
        )}
        {yamlQueryStatus === "error" && (
          <ErrorState img={MeowEmoji}>
            Hmm, we couldn't load any Flat data from this repository. <br /> Are
            you sure it has a valid Flat action in it?
          </ErrorState>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
