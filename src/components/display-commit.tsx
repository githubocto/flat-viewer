import React from "react";
import cc from "classcat";
import { parseFlatCommitMessage } from "../lib";

interface DisplayCommitProps {
  author?: string;
  message?: string;
  filename?: string | null;
}

export function DisplayCommit(props: DisplayCommitProps) {
  const { author, message, filename } = props;

  if (!message) return null;

  const isFlatCommit = author === "flat-data@users.noreply.github.com";
  if (!isFlatCommit)
    return (
      <div className="flex items-center justify-between">
        <div className="truncate">
          <span className="font-mono">{message}</span>
        </div>
      </div>
    );

  const parsed = parseFlatCommitMessage(message, filename || "");

  if (!parsed)
    return (
      <div className="flex items-center justify-between truncate">
        <span className="font-mono">{message}</span>
      </div>
    );

  const negativeDelta = parsed.file?.deltaBytes < 0;

  const byteClass = cc([
    "text-xs font-mono",
    {
      "text-red-700 bg-red-50 p-1 rounded": negativeDelta,
      "text-green-700 bg-green-100 p-1 rounded": !negativeDelta,
    },
  ]);

  return (
    <div className="flex items-center justify-between">
      <div className="truncate">
        <span className="font-mono">{parsed.message}</span>
      </div>

      <div className="pl-4 flex-shrink-0">
        <span className={byteClass}>
          <span>{negativeDelta ? "-" : "+"}</span>
          {Math.abs(parsed.file?.deltaBytes)}b
        </span>
      </div>
    </div>
  );
}
