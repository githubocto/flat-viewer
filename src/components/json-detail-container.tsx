import React from "react";
import { Portal } from "react-portal";
import { Grid } from "@githubocto/flat-ui";

import { useDataFile, useProgressBar } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import MeowCode from "../meow_code.gif";
import { Picker } from "./picker";
import { EmptyState } from "./empty-state";

interface JSONDetailProps {
  sha: string;
  filename: string;
  owner: string;
  name: string;
  filePickerRef: React.RefObject<HTMLDivElement> | null;
}

export function JSONDetail(props: JSONDetailProps) {
  const [dataKey, setDataKey] = React.useState("");
  const { sha, filename, owner, name, filePickerRef } = props;
  const queryResult = useDataFile({
    sha,
    filename,
    owner,
    name,
  });

  useProgressBar(queryResult);

  const { data, isLoading, isSuccess, isError } = queryResult;

  const parsed = data ? JSON.parse(data) : "";
  const parsedDataKeys = Object.keys(parsed);
  const hasMultipleKeys = parsedDataKeys.length > 0;

  const validKeys = parsed
    ? parsedDataKeys.filter((k) => {
        return Array.isArray(parsed[k]);
      })
    : [];

  const showKeyPicker = validKeys.length > 0 && hasMultipleKeys;

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
          {showKeyPicker && (
            <Portal node={filePickerRef?.current}>
              <Picker<string>
                label="Choose a key"
                items={validKeys}
                value={dataKey}
                onChange={setDataKey}
                placeholder="Select which field to visualize"
                itemRenderer={(item) => (
                  <span className="font-mono">{item}</span>
                )}
                selectedItemRenderer={(item) => (
                  <span className="font-mono">{item}</span>
                )}
              />
            </Portal>
          )}
          {showKeyPicker && !dataKey && (
            <EmptyState>
              <div className="space-y-4">
                <div>
                  Hmm, it looks like your data file has multiple keys with array
                  data.
                  <br />
                  Which one would you like to visualize?
                </div>
                <div className="max-w-xs mx-auto">
                  <Picker<string>
                    items={validKeys}
                    value={dataKey}
                    onChange={setDataKey}
                    placeholder="Select which field to visualize"
                    itemRenderer={(item) => (
                      <span className="font-mono">{item}</span>
                    )}
                    selectedItemRenderer={(item) => (
                      <span className="font-mono">{item}</span>
                    )}
                  />
                </div>
              </div>
            </EmptyState>
          )}
          {dataKey && validKeys.length > 0 && <Grid data={parsed[dataKey]} />}
          {validKeys.length === 0 && (
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
          )}
        </div>
      )}
    </React.Fragment>
  );
}
