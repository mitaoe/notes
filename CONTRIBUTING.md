# Contributing

Thanks for helping students find their notes. This covers running the site locally, the checks a pull request has to pass, and how an issue becomes a merged pull request. For how the code is organised and the conventions every change follows, read [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) first.

## Contents

- [Setup](#setup)
- [Checks](#checks)
- [Issues](#issues)
- [Pull requests](#pull-requests)

## Setup

Requires Node.js 24 and pnpm 11, as pinned in `package.json`, and Docker for the end-to-end tests.

Fork [mitaoe/notes](https://github.com/mitaoe/notes) on GitHub, then:

```bash
git clone https://github.com/<your-username>/notes.git
cd notes
git remote add upstream https://github.com/mitaoe/notes.git
pnpm install
cp .env.example .env
```

Fill in `.env` with a Google OAuth client and refresh token that can read the Drive, then:

```bash
pnpm dev            # http://localhost:5173, the app and the API functions together
```

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
pnpm test:e2e            # builds the app and runs the visual and navigation tests
```

All of them must pass with no warnings. CI runs them on every pull request to `main`, in two jobs, Checks and End-to-end, and both are required to merge.

The visual baselines in `e2e/__screenshots__` are the reference for how the site looks. A change that is not meant to alter the UI passes them untouched.

## Issues

Open an issue before you start work, describing the problem or the feature. Changes to the UI are agreed in the issue first; the current UI is the reference.

## Pull requests

- Fork the repository, branch from `main` and keep each pull request to one change.
- Titles follow Conventional Commits with a scope, for example `fix(files): stop list wrapper creating a scrollbar`.
- Branch names, commit messages and the description follow [Git and pull requests](AGENTS.md#git-and-pull-requests) in AGENTS.md. Link the issue with `Closes #N` in the description.
- A UI change updates the visual baselines with `pnpm test:e2e --update-snapshots`, so the changed images in the pull request show the before and after. Say in the description which ones changed and why.
- CI on a pull request from anyone who is not a collaborator on the repository waits until a maintainer approves the run.
- A maintainer reviews the pull request and squash-merges it once Checks and End-to-end pass, so it lands on `main` as one commit.
