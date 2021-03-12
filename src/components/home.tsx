import React from "react";
import FlatIcon from "../flat.svg";
import { RepoForm } from "./repo-form";

export function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-sm w-full text-center space-y-8">
        <img
          className="opacity-20 w-24 mx-auto"
          src={FlatIcon}
          alt="Flat Logo"
        />
        <RepoForm />
      </div>
    </div>
  );
}
