import React from "react";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";
import formatDistance from "date-fns/formatDistance";
import { GoStar } from "react-icons/go";

import { useOrgFlatRepos } from "../hooks";
import { ErrorState } from "./error-state";
import { Spinner } from "./spinner";
import Bug from "../bug.svg";
import { Repository } from "../types";

interface OrgListingProps extends RouteComponentProps<{ org: string }> {}

interface RepoListingProps {
  repos: Repository[];
  org: string;
}

function RepoListing(props: RepoListingProps) {
  return (
    <ul className="divide-y rounded-xl overflow-hidden">
      {props.repos.map((repo) => {
        const lastUpdated = formatDistance(
          Date.parse(repo.updated_at),
          new Date(),
          {
            addSuffix: true,
          }
        );

        return (
          <li className="bg-white hover:bg-opacity-70" key={repo.name}>
            <Link className="p-4 block" to={`/${props.org}/${repo.name}`}>
              <span className="text-indigo-600 font-medium">
                {props.org}/{repo.name}
              </span>
              <div className="mt-1 mb-2 text-lg">
                <p>{repo.description}</p>
              </div>
              <ul className="flex items-center space-x-3 text-sm text-gray-600">
                <li className="flex space-x-1 items-center">
                  <GoStar className="text-gray-400" />
                  <span>{repo.stargazers_count}</span>
                </li>
                <li>{repo.language}</li>
                {Boolean(repo.license) && <li>{repo.license.name}</li>}
                <li>Updated {lastUpdated}</li>
              </ul>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function OrgListing(props: OrgListingProps) {
  const { match } = props;
  const { org } = match.params;
  const { data = [], status } = useOrgFlatRepos(org);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-indigo-600 flex-shrink-0">
        <header className="flex justify-between items-center">
          <div className="text-indigo-100 font-light text-sm">
            <strong className="font-bold">Flat Viewer</strong> a simple tool for
            exploring flat data files in GitHub repositories.
          </div>
        </header>
      </div>
      {status === "loading" && (
        <div className="flex items-center justify-center h-full">
          <div className="max-w-sm flex items-center justify-center space-x-4">
            <Spinner />
            <p>Loading organization...</p>
          </div>
        </div>
      )}
      {status === "success" &&
        (data.length > 0 ? (
          <div className="p-4 overflow-scroll">
            <div className="mb-4">
              Repositories tagged{" "}
              <span className="bg-indigo-600 text-white text-xs p-1 rounded">
                flat-data
              </span>{" "}
              in the <span className="font-medium">{org}</span> organization.
            </div>
            <RepoListing repos={data} org={org} />
          </div>
        ) : (
          <ErrorState img={Bug} alt="Bug icon">
            <div className="max-w-sm mx-auto">
              Hmm, we couldn't find any repos with the topic{" "}
              <span className="bg-indigo-600 text-white text-xs p-1 rounded">
                flat-data
              </span>{" "}
              in this organization
            </div>
          </ErrorState>
        ))}
      {status === "error" && (
        <div className="flex items-center justify-center h-full">
          <ErrorState img={Bug} alt="Bug icon">
            Hmm, we could not load the organization.
          </ErrorState>
        </div>
      )}
    </div>
  );
}
