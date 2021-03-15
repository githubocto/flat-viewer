import React from "react";

import { useDataFile, useProgressBar } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import MeowCode from "../meow_code.gif";

interface JSONDetailProps {
  sha: string;
  filename: string;
  owner: string;
  name: string;
}

export function JSONDetail(props: JSONDetailProps) {
  const { sha, filename, owner, name } = props;
  const queryResult = useDataFile({
    sha,
    filename,
    owner,
    name,
  });

  useProgressBar(queryResult);

  const { data, isLoading, isSuccess, isError } = queryResult;

  const parsed = data ? JSON.parse(data) : "";

  return (
    <React.Fragment>
      {isError && (
        <ErrorState img={MeowCode}>
          Oh no, we couldn't load{" "}
          <em className="text-underline font-normal">{filename}</em> for some
          reason.
        </ErrorState>
      )}
      {isLoading && <LoadingState text="Loading data..." />}
      {isSuccess && data && (
        <div className="h-full overflow-auto p-4 font-mono text-xs p-4">
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </div>
      )}
    </React.Fragment>
  );
}
