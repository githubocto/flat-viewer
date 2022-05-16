import { sql } from "@codemirror/lang-sql";
import * as duckdb from "@duckdb/duckdb-wasm";
import { Grid } from "@githubocto/flat-ui";
import CodeMirror from "@uiw/react-codemirror";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import { useDebounce } from "use-debounce";
import Bug from "../bug.svg";
import { useDataFile } from "../hooks";
import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";
import { Spinner } from "./spinner";

interface Props {
  sha: string;
  filename: string;
  owner: string;
  name: string;
}

interface DBExplorerInnerProps {
  content: string;
  filename: string;
  extension: string;
  sha: string;
}

const VALID_EXTENSIONS = ["csv", "json"];

function DBExplorerInner(props: DBExplorerInnerProps) {
  const { content, extension, filename, sha } = props;
  const connectionRef = useRef<duckdb.AsyncDuckDBConnection | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [dbStatus, setDbStatus] = useState<"error" | "idle" | "success">(
    "idle"
  );

  const execQuery = async (query: string) => {
    if (!connectionRef.current) return;
    const queryRes = await connectionRef.current.query(query);
    const asArray = queryRes.toArray();
    return {
      numRows: queryRes.numRows,
      numCols: queryRes.numCols,
      results: asArray.map((row) => {
        return row.toJSON();
      }),
    };
  };

  const { data, status, error } = useQuery(
    ["query-results", filename, sha, debouncedQuery],
    () => execQuery(debouncedQuery),
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  useEffect(() => {
    const initDuckDb = async () => {
      const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
          mainModule: "/duckdb/duckdb.wasm",
          mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
        },
        eh: {
          mainModule: "/duckdb/duckdb-eh.wasm",
          mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
        },
      };
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      const c = await db.connect();
      connectionRef.current = c;

      try {
        if (extension === "csv") {
          await db.registerFileText(`data.csv`, content);
          await c.insertCSVFromPath(`data.csv`, { name: "data" });
        } else if (extension === "json") {
          await db.registerFileText(`data.json`, content);
          await c.insertJSONFromPath("data.json", { name: "data" });
        }
        setDbStatus("success");
        setQuery("select * from data");
      } catch {
        setDbStatus("error");
      }
    };

    initDuckDb();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
        setDbStatus("idle");
      }
    };
  }, [content, sha, filename]);

  const sqlSchema = useMemo(() => {
    if (!content) return [];

    if (extension === "csv") {
      const names = content.split("\n")[0].split(",");
      return names.map((name) => name.replace(/"/g, ""));
    } else if (extension === "json") {
      try {
        return Object.keys(JSON.parse(content)[0]);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }, [content]);

  return (
    <div className="flex-1 flex-shrink-0 overflow-hidden flex flex-col z-0">
      {dbStatus === "idle" && <LoadingState text="Initializing DuckDB 🦆" />}
      {dbStatus === "error" && (
        <ErrorState img={Bug} alt="Database initialization error">
          Couldn't initialize DuckDB 😕
        </ErrorState>
      )}
      {dbStatus === "success" && (
        <>
          <div className="border-b bg-gray-50 sticky top-0 z-20">
            <CodeMirror
              value={query}
              height={"120px"}
              className="w-full"
              extensions={[
                sql({
                  defaultTable: "data",
                  schema: {
                    data: sqlSchema,
                  },
                }),
              ]}
              onChange={(value) => {
                setQuery(value);
              }}
            />
          </div>
          <div className="flex-1 flex flex-col h-full overflow-scroll">
            {status === "error" && error && (
              <div className="bg-red-50 border-b border-red-600 p-2 text-sm text-red-600">
                {(error as Error)?.message || "An unexpected error occurred."}
              </div>
            )}
            <div className="relative flex-1 h-full">
              {status === "loading" && (
                <div className="absolute top-4 right-4 z-20">
                  <Spinner />
                </div>
              )}
              {data && (
                <Grid
                  data={data.results}
                  diffData={undefined}
                  defaultSort={undefined}
                  defaultStickyColumnName={undefined}
                  defaultFilters={{}}
                  downloadFilename={filename}
                  onChange={() => {}}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DBExplorer(props: Props) {
  const { sha, filename, owner, name } = props;
  const { data, status } = useDataFile(
    {
      sha,
      filename,
      owner,
      name,
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const extension = filename.split(".").pop() || "";
  const content = data ? data[0].content : "";

  return (
    <>
      {status === "loading" && <LoadingState />}
      {status === "success" && data && VALID_EXTENSIONS.includes(extension) && (
        <DBExplorerInner
          sha={sha}
          filename={filename}
          extension={extension}
          content={content}
        />
      )}
    </>
  );
}
