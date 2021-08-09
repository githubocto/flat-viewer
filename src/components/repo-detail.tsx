import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { GoThreeBars, GoX } from "react-icons/go";
import { BsArrowRightShort } from "react-icons/bs";
import {
  useDisclosureState,
  Disclosure,
  DisclosureContent,
} from "reakit/Disclosure";
import formatDistance from "date-fns/formatDistance";
import { useQueryParam, StringParam } from "use-query-params";
import toast, { Toaster } from "react-hot-toast";
import { ErrorState } from "./error-state";
import Bug from "../bug.svg";

import {
  BookmarkIcon,
  CommitIcon,
  LinkExternalIcon,
  RepoIcon,
} from "@primer/octicons-react";
import { Title } from "react-head";

import { useCommits, useGetFiles } from "../hooks";
import { Repo } from "../types";

import { JSONDetail } from "./json-detail-container";
import { parseFlatCommitMessage } from "../lib";
import { Picker } from "./picker";
import { FilePicker } from "./file-picker";
import { DisplayCommit } from "./display-commit";
import truncate from "lodash/truncate";

interface RepoDetailProps extends RouteComponentProps<Repo> {}

export function RepoDetail(props: RepoDetailProps) {
  const { match } = props;
  const { owner, name } = match.params;
  const [filename, setFilename] = useQueryParam("filename", StringParam);
  const [selectedSha, setSelectedSha] = useQueryParam("sha", StringParam);
  const disclosure = useDisclosureState();

  const {
    data: files,
    status: filesStatus,
    error: filesError,
  } = useGetFiles(
    { owner, name },
    {
      onSuccess: (data) => {
        if (!data.length) return;
        setFilename(filename || data[0], "replaceIn");
      },
    }
  );

  // Hook for fetching commits, once we've determined this is a Flat repo.
  const { data: commits = [] } = useCommits(
    { owner, name, filename },
    {
      enabled: Boolean(filename),
      onSuccess: (commits) => {
        const mostRecentCommitSha = commits[0].sha;

        if (commits.length > 0) {
          if (selectedSha) {
            if (commits.some((commit) => commit.sha === selectedSha)) {
              // noop
            } else {
              toast.error(
                "Hmm, we couldn't find a commit by that SHA. Reverting to the most recent commit.",
                {
                  duration: 4000,
                }
              );
              setSelectedSha(mostRecentCommitSha, "replaceIn");
            }
          } else {
            setSelectedSha(mostRecentCommitSha, "replaceIn");
          }
        }
      },
    }
  );

  const repoUrl = `https://github.com/${owner}/${name}`;

  const parsedCommit = selectedSha
    ? parseFlatCommitMessage(
        commits?.find((commit) => commit.sha === selectedSha)?.commit.message ||
          "",
        filename || ""
      )
    : null;
  const dataSource = parsedCommit?.file?.source;

  const selectedShaIndex = commits.findIndex((d) => d.sha === selectedSha);
  const selectedShaPrevious =
    selectedShaIndex !== -1
      ? (commits[selectedShaIndex + 1] || {}).sha
      : undefined;

  const controls = (
    <div className="lg:flex space-y-4 lg:space-y-0 lg:space-x-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-indigo-200">Repository</p>
        <div className="font-mono text-sm text-white">
          <a
            className="hover:underline focus:underline bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 rounded text-white inline-flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            target="_blank"
            rel="noopener noreferrer"
            href={repoUrl}
          >
            <div className="flex items-center space-x-2">
              <RepoIcon />
              <div
                className="overflow-ellipsis whitespace-nowrap overflow-hidden text-xs"
                style={{
                  maxWidth: "min(30em, 100% - 1em)",
                }}
              >
                {owner}/{name}
              </div>
              <div className="opacity-50">
                <LinkExternalIcon />
              </div>
            </div>
          </a>
        </div>
      </div>
      {!!(files || []).length && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-indigo-200">Data File</p>
          <FilePicker
            value={filename || ""}
            placeholder="Select a file"
            onChange={(newFilename) => {
              setFilename(newFilename);
            }}
            items={files || []}
            itemRenderer={(item) => (
              <span className="font-mono text-xs">{item}</span>
            )}
          />
        </div>
      )}

      {Boolean(filename) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-indigo-200">Commit</p>
          {commits && (
            <Picker<string>
              label="Choose a commit"
              placeholder="Select a SHA"
              onChange={setSelectedSha}
              value={selectedSha || ""}
              items={commits.map((commit) => commit.sha)}
              disclosureClass="appearance-none bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 px-2 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full lg:max-w-md"
              itemRenderer={(sha) => {
                const commit = commits.find((commit) => commit.sha === sha);
                return (
                  <div className="flex flex-col space-y-1 text-xs">
                    <DisplayCommit
                      message={commit?.commit.message}
                      author={commit?.commit.author?.email}
                      filename={filename}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-600">
                          {formatDistance(
                            new Date(commit?.commit.author?.date || ""),
                            new Date(),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }}
              selectedItemRenderer={(sha) => (
                <div className="flex items-center space-x-2">
                  <CommitIcon size={16} />
                  <div className="flex-1 truncate">
                    <DisplayCommit
                      message={
                        commits.find((commit) => commit.sha === sha)?.commit
                          .message
                      }
                      author={
                        commits.find((commit) => commit.sha === sha)?.commit
                          .author?.email
                      }
                      filename={filename}
                    />
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {!!dataSource && (
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium text-indigo-200">Data source</p>
          <a
            className="font-mono hover:underline focus:underline bg-indigo-700 hover:bg-indigo-800 focus:bg-indigo-800 h-9 rounded text-white flex items-center px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            href={dataSource}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex-none">
                <BookmarkIcon />
              </div>
              <div className="overflow-ellipsis whitespace-nowrap overflow-hidden text-xs">
                {dataSource}
              </div>
              <div className="opacity-50">
                <LinkExternalIcon />
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  );

  return (
    <React.Fragment>
      <Title>
        {owner}/{name} – Flat
      </Title>
      <Toaster position="bottom-left" />

      <div className="p-4 bg-indigo-600">
        <header className="flex justify-between items-center">
          <div className="text-indigo-100 font-light text-sm">
            <strong className="font-bold">Flat Viewer</strong> a simple tool for
            exploring flat data files in GitHub repositories.
          </div>
          <Disclosure
            {...disclosure}
            className="rounded-none focus:outline-none focus:ring lg:hidden text-white text-xl"
          >
            {disclosure.visible ? <GoX /> : <GoThreeBars />}
          </Disclosure>
        </header>
        <DisclosureContent
          className="lg:hidden overflow-visible mt-4"
          {...disclosure}
        >
          {controls}
        </DisclosureContent>
        <Disclosure
          {...disclosure}
          className="rounded-none focus:outline-none focus:ring lg:hidden text-white text-xl"
        >
          {!disclosure.visible && (
            <div className="flex items-center lg:hidden mt-4 text-white text-xs">
              <span className="">{truncate(`${owner}/${name}`)}</span>
              {Boolean(filename) && (
                <>
                  <span className="mx-1">
                    <BsArrowRightShort />
                  </span>{" "}
                  {truncate(filename || "")}
                </>
              )}
            </div>
          )}
        </Disclosure>
        <div className="controls mt-4">{controls}</div>
      </div>

      <React.Fragment>
        {selectedSha && Boolean(filename) && filesStatus !== "error" && (
          <JSONDetail
            key={selectedSha}
            filename={filename || ""}
            owner={owner as string}
            name={name as string}
            previousSha={selectedShaPrevious}
            sha={selectedSha}
          />
        )}
      </React.Fragment>
      {match &&
        !(files || []).length &&
        filesStatus !== "loading" &&
        !selectedSha && (
          <ErrorState img={Bug} alt="Error icon">
            {files
              ? "Hmm, we couldn't find any files in that repo"
              : // @ts-ignore
              filesError && filesError?.message === "Error: Rate limit exceeded"
              ? // @ts-ignore
                filesError?.message
              : "Hmm, are you sure that's a public GitHub repo?"}
          </ErrorState>
        )}
    </React.Fragment>
  );
}
