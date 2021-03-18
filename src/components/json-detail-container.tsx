import React from "react";
import { Portal } from "react-portal";
import { Grid } from "@githubocto/flat-ui";
import { useHistory } from "react-router-dom";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import { FileCodeIcon } from "@primer/octicons-react";

import { useDataFile, useProgressBar } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { Picker } from "./picker";
import { EmptyState } from "./empty-state";
import Bug from "../bug.svg";

interface JSONDetailProps {
  sha: string;
  filename: string;
  owner: string;
  name: string;
  filePickerRef: React.RefObject<HTMLDivElement> | null;
}

export function JSONDetail(props: JSONDetailProps) {
  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

  const [dataKey, setDataKey] = React.useState(
    (parsedQueryString?.key as string) || ""
  );

  const { sha, filename, owner, name, filePickerRef } = props;
  const queryResult = useDataFile(
    {
      sha,
      filename,
      owner,
      name,
    },
    {
      onSuccess: (data) => {
        const parsed = JSON.parse(data);
        if (dataKey) {
          if (parsed.hasOwnProperty(dataKey)) {
            // NOOP
          } else {
            toast.error(
              `Hmm, we couldn't find the key ${dataKey} on your data file...`,
              {
                duration: 4000,
              }
            );
            setDataKey("");
            const currentQueryString = qs.parse(history.location.search);
            history.push({
              search: qs.stringify({ sha: currentQueryString.sha }),
            });
          }
        }
      },
    }
  );

  useProgressBar(queryResult);

  const { data, isLoading, isSuccess, isError } = queryResult;

  const parsed = data ? JSON.parse(data) : "";

  const isFlatArray = Array.isArray(parsed);

  const parsedDataKeys = Object.keys(parsed);

  const hasMultipleKeys = parsedDataKeys.length > 0;

  const validKeys = parsed
    ? parsedDataKeys.filter((k) => {
        return Array.isArray(parsed[k]);
      })
    : [];

  const showKeyPicker = validKeys.length > 0 && hasMultipleKeys && !isFlatArray;

  React.useEffect(() => {
    if (dataKey) {
      const currentQueryString = qs.parse(history.location.search);
      history.push({
        search: qs.stringify({ key: dataKey, sha: currentQueryString.sha }),
      });
    }
  }, [dataKey]);

  return (
    <React.Fragment>
      <Toaster position="bottom-left" />
      {isError && (
        <ErrorState img={Bug} alt="Error icon">
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
              <div className="w-64">
                <Picker<string>
                  label="Choose a field"
                  items={validKeys}
                  value={dataKey}
                  onChange={setDataKey}
                  placeholder="Select which field to visualize"
                  itemRenderer={(item) => (
                    <span className="font-mono">
                      {item}{" "}
                      <span className="text-gray-500">
                        ({parsed[item].length} rows)
                      </span>
                    </span>
                  )}
                  selectedItemRenderer={(item) => (
                    <div className="flex w-full items-center space-x-2 truncate">
                      <span>
                        <FileCodeIcon />
                      </span>
                      <span className="font-mono">
                        Field: {item}{" "}
                        <span className="text-gray-500">
                          ({parsed[item].length} rows)
                        </span>
                      </span>
                    </div>
                  )}
                />
              </div>
            </Portal>
          )}
          {showKeyPicker && !dataKey && (
            <EmptyState alt="Empty state icon">
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

          {validKeys.length > 0 && dataKey && (
            <Grid diffData={[]} data={parsed[dataKey]} />
          )}
          {isFlatArray && <Grid diffData={[]} data={parsed} />}
        </div>
      )}
    </React.Fragment>
  );
}
