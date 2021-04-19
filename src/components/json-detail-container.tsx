import React from "react";
import { Grid } from "@githubocto/flat-ui";
import { useHistory } from "react-router-dom";
import qs from "query-string";
import toast, { Toaster } from "react-hot-toast";
import cc from "classcat";
import truncate from "lodash.truncate";

import { GridState } from "../lib";
import { useDataFile } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import Bug from "../bug.svg";
import { StringParam, useQueryParam } from "use-query-params";

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
  const [tabName, setTabName] = useQueryParam("tab", StringParam);

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
        const parsed = data;
        if (tabName) {
          if (parsed.hasOwnProperty(tabName)) {
            // NOOP
          } else {
            toast.error(
              `Hmm, we couldn't find the key ${tabName} on your data file...`,
              {
                duration: 4000,
              }
            );
            setTabName("");
            // const currentQueryString = qs.parse(history.location.search);
            // history.push({
            //   search: qs.stringify({ sha: currentQueryString.sha }),
            // });
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

  const { data, isError } = queryResult;
  const { data: pastQueryData } = pastQueryResult;

  const {
    diffData,
    parsed,
    isFlatArray,
    validKeys,
    showKeyPicker,
    isValidData,
  } = React.useMemo(() => {
    const diffData = pastQueryData ? pastQueryData : "";
    const parsed = data ? data : "";

    const isFlatArray = Array.isArray(parsed);

    const parsedDataKeys = Object.keys(parsed);

    const hasMultipleKeys = parsedDataKeys.length > 0;

    const validKeys = parsed
      ? parsedDataKeys.filter((k: any) => {
          return Array.isArray(parsed[k]);
        })
      : [];

    const showKeyPicker =
      validKeys.length > 0 && hasMultipleKeys && !isFlatArray;

    const isValidData = typeof data === "object";

    return {
      diffData,
      parsed,
      isFlatArray,
      validKeys,
      showKeyPicker,
      isValidData,
    };
  }, [data, pastQueryData]);

  React.useEffect(() => {
    if (!tabName && validKeys.length > 0) {
      setTabName(validKeys[0]);
    }
  }, [validKeys, tabName, setTabName]);

  // React.useEffect(() => {
  //   if (dataKey) {
  //     const currentQueryString = qs.parse(history.location.search);
  //     history.push({
  //       search: qs.stringify({ key: dataKey, sha: currentQueryString.sha }),
  //     });
  //   }
  // }, [dataKey]);

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
      {!isValidData && queryResult.status === "success" && (
        <ErrorState img={Bug} alt="Error icon">
          Oh no, we can't load that type of data from{" "}
          <em className="text-underline font-normal">{filename}</em>.
          <br />
          <pre className="text-sm text-gray-600 p-3 bg-white m-6 font-mono rounded-md max-w-3xl overflow-x-auto text-left mb-12 block whitespace-pre-wrap">
            {truncate(
              typeof data === "object"
                ? JSON.stringify(data, undefined, 2)
                : data?.toString(),
              { length: 3000 }
            )}
          </pre>
        </ErrorState>
      )}
      {(queryResult.status === "loading" ||
        pastQueryResult.status === "loading") && (
        <LoadingState text="Loading data..." />
      )}
      {isValidData &&
        queryResult.status === "success" &&
        (pastQueryResult.status === "success" ||
          pastQueryResult.status === "error") &&
        data && (
          <div className="h-full bg-indigo-600 overflow-auto flex flex-col text-xs relative">
            {showKeyPicker && (
              <div className="w-full px-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {validKeys.map((key) => {
                    const tabClass = cc([
                      "h-8 px-3 flex-shrink-0 appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-600 border-b relative rounded-tl rounded-tr",
                      {
                        "text-indigo-600 font-medium bg-white": key === tabName,
                        "bg-transparent border-transparent hover:bg-indigo-700 hover:border-indigo-200 focus:bg-indigo-700 focus:border-indigo-200 text-white":
                          key !== tabName,
                      },
                    ]);
                    return (
                      <button
                        onClick={() => setTabName(key)}
                        className={tabClass}
                        key={key}
                        style={{ top: 1 }}
                      >
                        {key}{" "}
                        <span className="opacity-75">
                          ({parsed[tabName].length} rows)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {showKeyPicker && !tabName && (
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

            {isFlatArray ? (
              <div className="relative h-full">
                <Grid
                  data={parsed}
                  diffData={diffData}
                  onChange={onGridChange}
                />
              </div>
            ) : validKeys.length > 0 && tabName ? (
              <div className="relative h-full">
                <Grid
                  data={parsed[tabName]}
                  diffData={diffData && diffData[tabName]}
                  // @ts-ignore
                  defaultFilters={urlGridState.filters}
                  defaultSort={urlGridState.sort}
                  defaultStickyColumnName={urlGridState.stickyColumnName}
                  onChange={onGridChange}
                />
              </div>
            ) : null}
          </div>
        )}
    </React.Fragment>
  );
}
