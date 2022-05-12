import React, { useRef, useState } from "react";

import { useMutation } from "react-query";
import { useRawDataFile } from "../hooks";
import { LoadingState } from "./loading-state";
import * as duckdb from "@duckdb/duckdb-wasm";

interface Props {
  sha: string;
  filename: string;
  owner: string;
  name: string;
}

interface ExecQueryParams {
  query: string;
}

export function DBExplorer(props: Props) {
  const [dbStatus, setDbStatus] = useState<"error" | "idle" | "success">(
    "idle"
  );
  const connectionRef = useRef<duckdb.AsyncDuckDBConnection>();

  const execQuery = async (params: ExecQueryParams) => {
    const { query } = params;
    if (!connectionRef.current) return;
    const queryRes = await connectionRef.current.query(query);
    return JSON.parse(queryRes.toString());
  };

  const { sha, filename, owner, name } = props;
  const { data, status } = useRawDataFile(
    {
      sha,
      filename,
      owner,
      name,
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
      onSuccess: async (res) => {
        if (connectionRef.current) return;

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
        await db.registerFileText(`data.json`, res);

        const c = await db.connect();
        connectionRef.current = c;
        await c.insertJSONFromPath("data.json", { name: "data" });
        setDbStatus("success");
      },
    }
  );

  // @ts-ignore
  const queryMutation = useMutation(execQuery);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    console.log("here");
    e.preventDefault();
    if (!data) return;
    // get form data
    const form = e.target as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);
    const query = formData.get("query");
    await queryMutation.mutateAsync({ query: query as string });
  };

  return (
    <>
      {status === "loading" && <LoadingState />}
      {status === "success" && (
        <div className="flex flex-col h-full">
          <div className="border-b bg-gray-50 p-4 sticky top-0">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center space-x-2">
                <input
                  className="font-mono shadow-sm focus:ring-gray-500 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:opacity-50 disabled:pointer-events-none"
                  name="query"
                  disabled={dbStatus !== "success"}
                  placeholder="Enter query"
                  type="text"
                />
                <button
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={dbStatus !== "success"}
                  type="submit"
                >
                  Execute
                </button>
              </div>
            </form>
          </div>
          <div className="flex-1 flex-shrink-0 overflow-hidden flex flex-col">
            {dbStatus === "idle" && (
              <LoadingState text="Initializing DuckDB 🦆" />
            )}
            {queryMutation.status === "loading" && <LoadingState />}
            {queryMutation.status === "idle" && dbStatus === "success" && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600">
                  Run a query to get started
                </p>
              </div>
            )}
            {queryMutation.status === "success" &&
              dbStatus === "success" &&
              data && (
                <pre className="overflow-auto">
                  {JSON.stringify(queryMutation.data, null, 2)}
                </pre>
              )}
          </div>
        </div>
      )}
    </>
  );
}
