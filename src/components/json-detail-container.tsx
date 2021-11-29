import React from "react";
import { Grid } from "@githubocto/flat-ui";
import { Toaster } from "react-hot-toast";
import cc from "classcat";
import truncate from "lodash.truncate";

import { decodeFilterString, encodeFilterString, GridState } from "../lib";
import { useDataFile } from "../hooks";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import Bug from "../bug.svg";
import { StringParam, useQueryParams } from "use-query-params";

interface JSONDetailProps {
  sha: string;
  previousSha?: string;
  filename: string;
  owner: string;
  name: string;
}

export function JSONDetail(props: JSONDetailProps) {
  const [query, setQuery] = useQueryParams({
    tab: StringParam,
    stickyColumnName: StringParam,
    sort: StringParam,
    filters: StringParam,
  });

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
        const tab =
          query.tab && data.find((d) => d.key === query.tab)
            ? query.tab
            : (data.find((d) => d.key) || {}).key;
        setQuery({ tab }, "replaceIn");
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

  const tabIndex = data.findIndex((d) => d?.key === query.tab) || 0;
  const tabData = data[tabIndex] || {};
  const tabDiffData = diffData[tabIndex] || {};

  const decodedFilterString = decodeFilterString(query.filters);
  const [hasMounted, setHasMounted] = React.useState(false);

  const onTabChange = (tab: string) =>
    setQuery(
      {
        tab,
        sort: undefined,
        stickyColumnName: undefined,
        filters: undefined,
      },
      "replaceIn"
    );

  const onGridChange = (newState: GridState) => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    setQuery(
      {
        sort: newState.sort.join(","),
        stickyColumnName: newState.stickyColumnName,
        filters: encodeFilterString(newState.filters),
      }, 
      "replaceIn"
    );
  };

  React.useEffect(() => {
    if (!hasMounted) return;
    setHasMounted(false);

    setQuery(
      {
        sort: undefined,
        stickyColumnName: undefined,
        filters: undefined,
      },
      "replaceIn"
    );
  }, [filename]);

  const date = new Date().toLocaleDateString();
  const downloadFilename = `${owner}_${name}__${filename}__${date}`.replace(
    /\./g,
    "-"
  );

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
              {data.map(({ key, value }) => {
                const tabClass = cc([
                  "h-8 px-3 flex-shrink-0 appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-600 border-b relative rounded-tl rounded-tr",
                  {
                    "text-indigo-600 font-medium bg-white": key === query.tab,
                    "bg-transparent border-transparent hover:bg-indigo-700 hover:border-indigo-200 focus:bg-indigo-700 focus:border-indigo-200 text-white":
                      key !== query.tab,
                  },
                ]);
                return (
                  <button
                    onClick={() => key && onTabChange(key)}
                    className={tabClass}
                    key={key}
                    style={{ top: 1 }}
                  >
                    {key}{" "}
                    {value?.length && (
                      <span className="opacity-75">({value?.length} rows)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {showKeyPicker && !query.tab && (
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
              defaultSort={query.sort ? query.sort.split(",") : undefined}
              defaultStickyColumnName={
                query.stickyColumnName ? query.stickyColumnName : undefined
              }
              defaultFilters={decodedFilterString || {}}
              downloadFilename={downloadFilename}
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
        {!tabData.value && queryResult.status === "success" && (
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
