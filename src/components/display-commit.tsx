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
      "text-red-600": negativeDelta,
      "text-green-600": !negativeDelta,
    },
  ]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs mr-3">{parsed.message}</span>
      <span className={byteClass}>
        <span>{negativeDelta ? "-" : "+"}</span>
        {Math.abs(parsed.file.deltaBytes)}
      </span>
    </div>
  );
}
