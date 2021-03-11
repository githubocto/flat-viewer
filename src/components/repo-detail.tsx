import React from "react";
import { RouteComponentProps } from "react-router";
import { RepoIcon } from "@primer/octicons-react";

import { useFlatYaml } from "../hooks";
import { Repo } from "../types";
import { JSONDetailContainer } from "./json-detail-container";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;
  const { data, isSuccess, isLoading, isError } = useFlatYaml({ owner, name });

  return (
    <React.Fragment>
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <RepoIcon />
          <p className="font-mono text-sm">
            {owner}/{name}
          </p>
        </div>
      </div>
      <React.Fragment>
        {isLoading && <div className="p-4">Loading...</div>}
        {isSuccess && data && (
          <JSONDetailContainer filename={data} owner={owner} name={name} />
        )}
        {isError && (
          <div className="p-4">Hmm... Are you sure this is a Flat repo?</div>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}
