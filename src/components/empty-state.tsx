import React from "react";
import WavingCat from "../meow_wave2.png";

interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <div className="max-w-xl w-full text-center space-y-4">
        <img
          className="grayscale w-24 mx-auto"
          src={WavingCat}
          alt="Waving cat emoji"
        />
        <div className="leading-relaxed text-gray-600 font-mono">
          {props.children}
        </div>
      </div>
    </div>
  );
}
