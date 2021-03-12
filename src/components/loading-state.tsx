import React from "react";
import { Spinner } from "./spinner";

interface LoadingStateProps {
  text?: string;
}

export function LoadingState(props: LoadingStateProps) {
  const { text = "Loading..." } = props;

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <div className="flex items-center space-x-2">
        <Spinner />
        <span className="font-mono text-sm">{text}</span>
      </div>
    </div>
  );
}
