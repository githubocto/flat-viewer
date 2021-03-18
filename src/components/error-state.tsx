import React from "react";

interface ErrorStateProps {
  img: string;
  alt: string;
  children: React.ReactNode;
}

export function ErrorState(props: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <div className="max-w-xl w-full text-center space-y-4">
        <img
          className="grayscale w-24 mx-auto"
          src={props.img}
          alt={props.alt}
        />
        <p className="leading-relaxed text-gray-600 font-mono">
          {props.children}
        </p>
      </div>
    </div>
  );
}
