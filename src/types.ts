import { Endpoints } from "@octokit/types";

export type Commit = Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"][0];

export type Repo = {
  owner: string;
  name: string;
};
