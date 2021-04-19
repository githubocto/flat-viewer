import React from "react";
import Code from "../code.svg";

interface EmptyStateProps {
  children: React.ReactNode;
  alt: string;
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <div className="max-w-4xl w-full text-center space-y-4 px-4 lg:px-0">
        <img className="grayscale w-24 mx-auto" src={Code} alt={props.alt} />
        <div className="leading-relaxed text-gray-600 font-mono text-lg">
          {props.children}
        </div>
      </div>
    </div>
  );
}
