import React from "react";
import cc from "classcat";

export function parseCommitMessage(message?: string) {
  if (!message) return;

  const regex = new RegExp(/\(([^)]+)\)/);
  const match = message.match(regex);

  if (!match) return;

  const rawByteString = match[1];
  const isNegative = rawByteString.includes("--");

  return {
    message: message.replace(match[0], "").trim(),
    byteString: rawByteString,
    delta: isNegative ? "negative" : "positive",
  };
}
interface DisplayCommitProps {
  message?: string;
}

export function DisplayCommit(props: DisplayCommitProps) {
  const { message } = props;
  if (!message) return null;

  const parsed = parseCommitMessage(message);
  const byteClass = cc([
    "text-xs font-mono",
    {
      "text-red-600": parsed?.delta === "negative",
      "text-green-600": parsed?.delta === "positive",
    },
  ]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs mr-3">{parsed?.message} </span>
      <span className={byteClass}>{parsed?.byteString}</span>
    </div>
  );
}
