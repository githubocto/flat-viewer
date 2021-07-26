import { Endpoints } from "@octokit/types";

export type Commit =
  Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"][0];

export type Repo = {
  owner: string;
  name: string;
};

export interface FlatDataTab {
  key?: string;
  value?: object[];
  invalidValue?: string;
}

interface RepositoryLicense {
  key: string;
  name: string;
  url: string;
}

export interface Repository {
  name: string;
  description: string;
  id: string;
  topics?: string[];
  stargazers_count: number;
  language: string;
  updated_at: string;
  license: RepositoryLicense;
}
