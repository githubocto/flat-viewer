import React from "react";
import cc from "classcat";
import { parseFlatCommitMessage } from "../lib";

interface DisplayCommitProps {
  message?: string;
}

export function DisplayCommit(props: DisplayCommitProps) {
  const { message } = props;

  if (!message) return null;

  const parsed = parseFlatCommitMessage(message);
  if (!parsed) return null;

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
      <span className="font-mono mr-3">{parsed.message}</span>
      <span className={byteClass}>
        <span>{negativeDelta ? "-" : "+"}</span>
        {Math.abs(parsed.file.deltaBytes)}b
      </span>
    </div>
  );
}
