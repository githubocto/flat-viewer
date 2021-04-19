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
        const newTab =
          tabName && data.find((d) => d.key === tabName)
            ? tabName
            : (data.find((d) => d.key) || {}).key;
        setTabName(newTab);
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
    {
      enabled: Boolean(previousSha),
    }
  );

  const { data = [], isError } = queryResult;
  const { data: diffData = [] } = pastQueryResult;

  const showKeyPicker = data.length > 1;

  const tabIndex = data.findIndex((d) => d?.key === tabName) || 0;
  const tabData = data[tabIndex] || {};
  const tabDiffData = diffData[tabIndex] || {};

  // React.useEffect(() => {
  //   if (!tabName && data.length > 0) {
  //     setTabName(data[0].key || "");
  //   }
  // }, [validKeys, tabName, setTabName]);

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

  if (queryResult.status === "loading") {
    return <LoadingState text="Loading data..." />;
  } else if (queryResult.status === "error") {
    return (
      <ErrorState img={Bug} alt="Error icon">
        Oh no, we couldn't load{" "}
        <em className="text-underline font-normal">{filename}</em> for some
        reason.
      </ErrorState>
    );
  }

  return (
    <>
      <Toaster position="bottom-left" />
      <div className="flex-1 overflow-auto flex flex-col text-xs relative">
        {showKeyPicker && (
          <div className="w-full px-4 bg-indigo-600 ">
            <div className="flex space-x-2 overflow-x-auto">
              {data.map(({ key }) => {
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
                      ({tabData.value?.length} rows)
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
                Hmm, it looks like your data file has multiple keys with array
                data.
                <br />
                Select the tab of the key you'd like to visualize.
              </div>
            </div>
          </EmptyState>
        )}
        {!!tabData.value && (
          <div className="relative h-full">
            <Grid
              data={tabData.value}
              diffData={tabDiffData.value}
              onChange={onGridChange}
            />
          </div>
        )}
        {isError && (
          <ErrorState img={Bug} alt="Error icon">
            Oh no, we couldn't load{" "}
            <em className="text-underline font-normal">{filename}</em> for some
            reason.
          </ErrorState>
        )}
        {tabName && !tabData.value && queryResult.status === "success" && (
          <ErrorState img={Bug} alt="Error icon">
            Oh no, we can't load that type of data from{" "}
            <em className="text-underline font-normal">{filename}</em>.
            <br />
            <pre className="text-sm text-gray-600 p-3 bg-white m-6 font-mono rounded-md max-w-3xl overflow-x-auto text-left mb-12 block whitespace-pre-wrap">
              {truncate(tabData.invalidValue, { length: 3000 })}
            </pre>
          </ErrorState>
        )}
      </div>
    </>
  );
}
