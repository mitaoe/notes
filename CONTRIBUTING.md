# Contributing

Thanks for helping students find their notes. This covers running the site locally, the checks a pull request has to pass, and how an issue becomes a merged pull request. For how the code is organised and the conventions every change follows, read [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) first.

## Contents

- [Setup](#setup)
- [Checks](#checks)
- [Issues](#issues)
- [Pull requests](#pull-requests)

## Setup

Requires Node.js 26 and pnpm 11, as pinned in `package.json`, and Docker for the end-to-end tests.

Fork [mitaoe/notes](https://github.com/mitaoe/notes) on GitHub, then:

```bash
git clone https://github.com/<your-username>/notes.git
cd notes
git remote add upstream https://github.com/mitaoe/notes.git
pnpm install
cp .env.example .env
```

Fill in `.env` with your own Google OAuth client and a refresh token for your Google account, then:

```bash
pnpm dev            # http://localhost:5173, the app and the API functions together
```

The site then lists that account's My Drive, and search covers every Drive the account can read. Browsing and search need only Drive read access. Downloading or previewing a file that is not already public makes it viewable by anyone with the link, as the live site does, but only when the account can share it (`capabilities.canShare`). That needs the full `https://www.googleapis.com/auth/drive` scope, so use an account whose files you are happy to share that way.

The checks below run against an in-memory Drive and a mocked API, so they need no credentials.

## Checks

```bash
pnpm format:check   # oxfmt; pnpm format fixes what it reports
pnpm lint           # oxlint, including type-aware rules
pnpm typecheck
pnpm test           # unit and component tests with Vitest
pnpm build
```

```bash
pnpm playwright:server   # in a second terminal, starts the Playwright browser in Docker
pnpm playwright:wait     # waits until that browser accepts connections
pnpm test:e2e            # builds the app and runs the visual and navigation tests
```

The first `pnpm playwright:server` downloads the Playwright Docker image, so it can take several minutes before `pnpm playwright:wait` returns.

All of them must pass with no warnings. CI runs them on every pull request to `main`, in two jobs, Checks and End-to-end, and both are required to merge.

The visual baselines in `e2e/__screenshots__` are the reference for how the site looks. A change that is not meant to alter the UI passes them untouched.

## Issues

Open an issue before you start work, one for each concern, describing the problem or the feature. Changes to the UI are agreed in the issue first; the current UI is the reference.

## Pull requests

Start each change on a new branch from the latest `main`:

```bash
git fetch upstream
git switch -c <username>/<short-slug> upstream/main
```

The new branch starts out tracking `upstream/main`, so a plain `git push` does not reach your fork. After your first commit, publish the branch to your fork:

```bash
git push -u origin HEAD
```

From then on, `git push` updates the branch and its pull request. To pick up newer changes on `main`, run `git fetch upstream` and `git rebase upstream/main`, then `git push --force-with-lease`, rather than merging `main` in.

- Keep a pull request to one concern; it resolves several issues only when they are the same change.
- Titles follow [Conventional Commits](https://www.conventionalcommits.org/) with a scope, for example `fix(files): stop list wrapper creating a scrollbar`.
- Branch names, commit messages and the description follow [Git and pull requests](AGENTS.md#git-and-pull-requests) in AGENTS.md. The description has four sections, in order: Overview, which ends with one `Closes #N` line for each issue it resolves, What this changes, Not addressed here and Verification.
- A UI change updates the visual baselines with `pnpm test:e2e --update-snapshots`, so the changed images in the pull request show the before and after. Say under What this changes which ones changed and why.
- CI on a pull request from anyone outside the mitaoe organisation who is not a collaborator on the repository waits until a maintainer approves it.
- A maintainer reviews the pull request and squash-merges it once Checks and End-to-end pass. Squash is the only merge method the repository and its `main` ruleset allow. The pull request title becomes the commit subject on `main` and the commit body is left blank, so the title has to describe everything the pull request does.
- Issues and pull requests with no activity for 7 days are labelled `stale` and closed 30 days later; a comment removes the label at the next run. Items labelled `pinned`, `security`, `help wanted` or `good first issue` are never marked or closed, and neither are pull requests labelled `dependencies`, which Dependabot adds to its own. If one of these labels is added to an item that is already `stale`, the `stale` label stays until it is removed by hand.
