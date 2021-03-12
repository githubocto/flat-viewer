import React, { useState } from "react";

import { SHAPicker } from "./sha-picker";
import { useCommits, useDataFile, useProgressBar } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import MeowCode from "../meow_code.gif";

interface JSONDetailContainerProps {
  filename: string;
  owner: string;
  name: string;
}

interface JSONDetailProps {
  sha: string;
  filename: string;
  owner: string;
  name: string;
}

function JSONDetail(props: JSONDetailProps) {
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

export function JSONDetailContainer(props: JSONDetailContainerProps) {
  const { filename, name, owner } = props;
  const [selectedSha, setSelectedSha] = useState<string>();

  const { data, isLoading, isSuccess, isError } = useCommits(
    {
      filename,
      owner: owner as string,
      name: name as string,
    },
    {
      onSuccess: (commits) => {
        if (commits.length > 0) {
          const mostRecentCommitSha = commits[0].sha;
          setSelectedSha(mostRecentCommitSha);
        }
      },
    }
  );

  return (
    <React.Fragment>
      {isLoading && <LoadingState text={`Loading details for ${filename}`} />}
      {isError && (
        <ErrorState img={MeowCode}>
          Oh no, we couldn't load{" "}
          <em className="text-underline font-normal">{filename}</em> for some
          reason.
        </ErrorState>
      )}
      {isSuccess && data && (
        <React.Fragment>
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              {selectedSha && (
                <SHAPicker
                  onChange={setSelectedSha}
                  value={selectedSha}
                  commits={data}
                />
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedSha && (
              <JSONDetail
                filename={filename}
                owner={owner as string}
                name={name as string}
                sha={selectedSha}
              />
            )}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
