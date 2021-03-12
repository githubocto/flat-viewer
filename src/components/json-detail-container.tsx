import React, { useState } from "react";

import { SHAPicker } from "./sha-picker";
import { useCommits, useDataFile } from "../hooks";

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
  const { data, isLoading, isSuccess, isError } = useDataFile({
    sha,
    filename,
    owner,
    name,
  });

  const parsed = data ? JSON.parse(data) : "";

  return (
    <React.Fragment>
      {isError && <div>Error while loading file :(</div>}
      {isLoading && <div>Loading file...</div>}
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
      {isLoading && <div>Loading details for {filename}</div>}
      {isError && <div>Failed toloading details for {filename}</div>}
      {isSuccess && data && (
        <React.Fragment>
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <SHAPicker
                onChange={setSelectedSha}
                value={selectedSha}
                commits={data}
              />
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
