import React from "react";

interface ErrorStateProps {
  img: string;
  alt: string;
  children: React.ReactNode;
}

export function ErrorState(props: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full py-6 overflow-y-auto">
      <div className="max-w-prose w-full text-center space-y-4 px-4 py-6 lg:px-0 max-h-full">
        <img
          className="grayscale w-24 mx-auto"
          src={props.img}
          alt={props.alt}
        />
        <div className="leading-relaxed text-gray-600 font-mono">
          {props.children}
        </div>
      </div>
    </div>
  );
}
