import React from "react";
import { RouteComponentProps } from "react-router";
import { RepoIcon } from "@primer/octicons-react";

import { useFlatYaml, useProgressBar } from "../hooks";
import { Repo } from "../types";

import MeowEmoji from "../meow_huh.png";

import { JSONDetailContainer } from "./json-detail-container";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;
  const queryResult = useFlatYaml({ owner, name });
  const { data, isSuccess, isLoading, isError } = queryResult;

  useProgressBar(queryResult);

  return (
    <React.Fragment>
      <div className="relative">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <RepoIcon />
            <p className="font-mono text-sm">
              {owner}/{name}
            </p>
          </div>
        </div>
      </div>
      <React.Fragment>
        {isLoading && <LoadingState />}
        {isSuccess && data && (
          <JSONDetailContainer filename={data} owner={owner} name={name} />
        )}
        {isError && (
          <ErrorState img={MeowEmoji}>
            Hmm, we couldn't load any Flat data from this repository. <br /> Are
            you sure it has a valid Flat action in it?
          </ErrorState>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
