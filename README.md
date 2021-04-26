# Flat Viewer

Flat Viewer is a tool to view un-nested data (CSV & JSON files) in an interactive table. The table has various affordances for exploring the data, such as:

- filtering
- sorting
- sticky header and column
- diffs for specific commits that change the data

![Flat Viewer](./screeenshot.png)

Flat is an experiment from [GitHub's Office of the CTO](https://octo.github.com) to make it easier for anyone to explore data stored in a Git repository.

## Usage

To use Flat Viewer, prepend `flat` to the URL of your GitHub repo:

from: [`github.com/githubocto/flat-demo-covid-dashboard`](http://github.com/githubocto/flat-demo-covid-dashboard)
to: [`flatgithub.com/githubocto/flat-demo-covid-dashboard`](http://flatgithub.com/githubocto/flat-demo-covid-dashboard)

Flat Viewer will let you choose a specific CSV or JSON file in your repo, as well as the specific commit to view.

## Development

To run locally:

```bash
yarn # to install dependencies
yarn dev
```

## Deployment

flatgithub.com will automatically re-build and deploy when changes are pushed to the `main` branch.

## Issues

If you run into any trouble or have questions, feel free to [open an issue](https://github.com/githubocto/flat-editor/issues). Sharing your `flat.yml` with us in the issue will help us understand what might be happening.

❤️ GitHub OCTO
