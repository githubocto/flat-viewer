import React from "react";
import { Grid } from "@githubocto/flat-ui";
import { useHistory } from "react-router-dom";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import cc from "classcat";

import { useDataFile, useProgressBar } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import Bug from "../bug.svg";

interface JSONDetailProps {
  sha: string;
  previousSha?: string;
  filename: string;
  owner: string;
  name: string;
}

export function JSONDetail(props: JSONDetailProps) {
  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

  const [dataKey, setDataKey] = React.useState(
    (parsedQueryString?.key as string) || ""
  );

  const { sha, previousSha, filename, owner, name } = props;
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
  const pastQueryResult = useDataFile(
    {
      // @ts-ignore
      sha: previousSha,
      filename,
      owner,
      name,
    },
    {}
  );

  useProgressBar(queryResult);

  const { data, isLoading, isSuccess, isError } = queryResult;
  const { data: pastQueryData } = pastQueryResult;
  const diffData = pastQueryData ? JSON.parse(pastQueryData) : "";

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
        <div className="h-full bg-white overflow-auto flex flex-col font-mono text-xs relative">
          {showKeyPicker && (
            <div className="w-full bg-indigo-600 px-4 pt-2 space-x-4">
              {validKeys.map((key) => {
                const tabClass = cc([
                  "h-8 px-2 appearance-none rounded-tr rounded-tl focus:outline-none focus:ring-2 focus:ring-inset-1 focus:ring-indigo-600",
                  {
                    "bg-white": key === dataKey,
                    "bg-indigo-700 text-white hover:bg-indigo-800 focus:bg-indigo-800":
                      key !== dataKey,
                  },
                ]);
                return (
                  <button
                    onClick={() => setDataKey(key)}
                    className={tabClass}
                    key={key}
                  >
                    {key}{" "}
                    <span className="opacity-75">
                      ({parsed[key].length} rows)
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {showKeyPicker && !dataKey && (
            <EmptyState alt="Empty state icon">
              <div className="space-y-4">
                <div>
                  Hmm, it looks like your data file has multiple keys with array
                  data.
                  <br />
                  Select the tab of the key you'd like to visualize.
                </div>
              </div>
            </EmptyState>
          )}

          {validKeys.length > 0 && dataKey && (
            <div className="relative h-full">
              <Grid
                data={parsed[dataKey]}
                diffData={diffData && diffData[dataKey]}
              />
            </div>
          )}
          {isFlatArray && (
            <div className="relative h-full">
              <Grid data={parsed} diffData={diffData} />
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
}
