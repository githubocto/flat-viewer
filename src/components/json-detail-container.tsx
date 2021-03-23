import React from "react";
import { Grid } from "@githubocto/flat-ui";
import { useHistory } from "react-router-dom";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import cc from "classcat";

import { GridState } from "../lib";
import { useDataFile } from "../hooks";
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
  urlGridState: GridState;
  onGridStateChange: (newGridState: GridState) => void;
}

export function JSONDetail(props: JSONDetailProps) {
  const history = useHistory();
  const parsedQueryString = qs.parse(history.location.search);

  const [dataKey, setDataKey] = React.useState(
    (parsedQueryString?.key as string) || ""
  );

  const {
    sha,
    previousSha,
    filename,
    owner,
    name,
    urlGridState,
    onGridStateChange,
  } = props;
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

  const pastQueryResult = useDataFile({
    // @ts-ignore
    sha: previousSha,
    filename,
    owner,
    name,
  });

  const { data, isLoading, isSuccess, isError } = queryResult;
  const { data: pastQueryData } = pastQueryResult;

  const {
    diffData,
    parsed,
    isFlatArray,
    validKeys,
    showKeyPicker,
  } = React.useMemo(() => {
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

    const showKeyPicker =
      validKeys.length > 0 && hasMultipleKeys && !isFlatArray;

    return {
      diffData,
      parsed,
      isFlatArray,
      validKeys,
      showKeyPicker,
    };
  }, [data, pastQueryData]);

  React.useEffect(() => {
    if (dataKey) {
      const currentQueryString = qs.parse(history.location.search);
      history.push({
        search: qs.stringify({ key: dataKey, sha: currentQueryString.sha }),
      });
    }
  }, [dataKey]);

  const onGridChange = (newState: GridState) => {
    onGridStateChange({
      filters: newState.filters,
      sort: newState.sort,
      stickyColumnName: newState.stickyColumnName,
    });
  };

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
      {(queryResult.status === "loading" ||
        pastQueryResult.status === "loading") && (
        <LoadingState text="Loading data..." />
      )}
      {queryResult.status === "success" &&
        (pastQueryResult.status === "success" ||
          pastQueryResult.status === "error") &&
        data && (
          <div className="h-full bg-white overflow-auto flex flex-col text-xs relative">
            {showKeyPicker && (
              <div className="w-full px-4 pb-4 bg-indigo-600">
                <div className="border-b border-indigo-500 flex space-x-2 overflow-x-auto pb-px">
                  {validKeys.map((key) => {
                    const tabClass = cc([
                      "h-8 px-2 flex-shrink-0 appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-600 border-b relative",
                      {
                        "text-white border-white bg-indigo-700":
                          key === dataKey,
                        "bg-transparent border-transparent hover:bg-indigo-700 hover:border-indigo-200 focus:bg-indigo-700 focus:border-indigo-200 text-white":
                          key !== dataKey,
                      },
                    ]);
                    return (
                      <button
                        onClick={() => setDataKey(key)}
                        className={tabClass}
                        key={key}
                        style={{ top: 1 }}
                      >
                        {key}{" "}
                        <span className="opacity-75">
                          ({parsed[key].length} rows)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {showKeyPicker && !dataKey && (
              <EmptyState alt="Empty state icon">
                <div className="space-y-4">
                  <div>
                    Hmm, it looks like your data file has multiple keys with
                    array data.
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
                  // @ts-ignore
                  defaultFilters={urlGridState.filters}
                  defaultSort={urlGridState.sort}
                  defaultStickyColumnName={urlGridState.stickyColumnName}
                  onChange={onGridChange}
                />
              </div>
            )}
            {isFlatArray && (
              <div className="relative h-full">
                <Grid
                  data={parsed}
                  diffData={diffData}
                  onChange={onGridChange}
                />
              </div>
            )}
          </div>
        )}
    </React.Fragment>
  );
}
