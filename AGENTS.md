# Contributing guide

This file defines how the repository is organised and the conventions every change follows, for people and for coding agents alike. Read [ARCHITECTURE.md](ARCHITECTURE.md) first for how the pieces fit together.

## Before you finish a change

Run the same checks as CI. All of them must pass with no warnings:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright:server   # in a second terminal, needs Docker
pnpm test:e2e
```

`pnpm format` fixes formatting. Everything else is fixed in the code, never by loosening a rule or skipping a test.

## Folder structure

```text
api/                 Vercel Functions, one GET endpoint per file
  _lib/              Code shared by the endpoints (Google client, Drive queries, HTTP helpers)
  _tests/            Tests and fakes for the API
  tsconfig.json      TypeScript project for the functions
shared/              Code imported by both the API and the web app
src/                 The web app
  api/               Typed client for the endpoints in api/
  components/        React components and their CSS modules
  hooks/             React hooks
  lib/               Framework-free helpers
  pages/             One component per route
  styles/            Global CSS, the Mantine stylesheet list and shared CSS modules
  test/              Test setup and render helpers
  App.tsx            Providers and routes
  config.ts          Site constants (names, links)
  icons.ts           The icons the app uses
  main.tsx           Entry point
  theme.ts           Mantine theme
e2e/                 Playwright tests
  __screenshots__/   Visual baselines, the reference for how the site looks
  fixtures/          The fake Drive the tests browse
  support/           The /api mock built on the fixtures
public/              Files served as-is
scripts/             Node scripts used by package.json
vite/                Vite plugins and tests for the build tooling
```

Every `.ts` file directly in `api/` whose name does not start with `_` becomes a public endpoint. Helpers and tests must live under `api/_lib/` and `api/_tests/`.

## File naming

| Kind             | Name                             | Example                          |
| ---------------- | -------------------------------- | -------------------------------- |
| React component  | `PascalCase.tsx`, named after it | `FileRow.tsx`                    |
| Component styles | same name with `.module.css`     | `FileRow.module.css`             |
| Page             | `PascalCase` ending in `Page`    | `SearchPage.tsx`                 |
| Hook             | `useCamelCase.ts`                | `usePagedFiles.ts`               |
| Other modules    | `kebab-case.ts` or a single word | `folder-path.ts`, `format.ts`    |
| API endpoint     | the URL segment                  | `api/list.ts` serves `/api/list` |
| Unit test        | next to the code, `.test.ts(x)`  | `FileRow.test.tsx`               |
| End-to-end test  | `e2e/<area>.spec.ts`             | `e2e/navigation.spec.ts`         |

One component per file. A file exports the things it is named after, plus the types callers need to pass them (`FolderOpener` next to `FileRow`, `PageLoader` next to `usePagedFiles`).

## Code conventions

- TypeScript everywhere. No `any`, no non-null assertions and no `as` casts on untrusted data; oxlint enforces the first two.
- Validate data at every boundary with valibot: Google responses in `api/_lib/`, API responses in `src/api/`. Infer types from the schemas instead of declaring them twice.
- Use `null` for "no value" in our own types. `undefined` only appears where an external API produces it.
- Named exports only, enforced by oxlint. Tool configs that must default-export are listed as exceptions in `.oxlintrc.json`.
- Relative imports include the file extension (`./drive.ts`, `./FileRow.tsx`). oxfmt sorts and groups imports.
- No comments in source code. Names carry the meaning; the reasoning behind a constraint belongs in ARCHITECTURE.md.
- Fixed values (limits, delays, URLs, patterns) are `SCREAMING_SNAKE_CASE` constants at the top of the module that owns them. Never repeat a value that already has a name elsewhere.

## React conventions

- Function components with a `<Component>Props` type for their props. Logic shared by components lives in a hook in `src/hooks/`, and a class shared by CSS modules lives in `src/styles/`.
- Derive values during render. Use effects only to synchronise with something outside React (the network, timers, the DOM), and give them honest dependency lists; to reset a component on a new value, change its `key`.
- Style with a CSS module next to the component and combine classes with `clsx`. Mantine style props (`mb`, `p`, `gap`) are fine for spacing. Use Mantine CSS variables (`var(--mantine-color-dark-7)`, `alpha(var(--mantine-color-red-8), 0.15)`) instead of copying colours, and do not restate what Mantine or the browser already applies.
- Import icons from `src/icons.ts`, adding a line there for a new one.
- When you use a Mantine component for the first time, add its stylesheet to `src/styles/mantine.css` in Mantine's bundle order. `vite/mantine-css.test.ts` names any stylesheet that is missing and fails on the wrong order.
- Use real elements: links (`Link`, `Anchor`) for navigation and buttons for actions. Every icon-only control gets an accessible name through `aria-label` or `title`.

## API conventions

- One endpoint per file, exporting `GET = handleGet(async (params) => ...)`.
- Read parameters with the helpers in `api/_lib/http.ts`. Signal client errors by throwing `HttpError`, passing a cache policy when the answer depends only on the URL (a 404 for a missing folder); let anything unexpected propagate so it is logged and answered with a 500.
- Every response sets a policy from `CACHE_CONTROL`. Anything that depends only on the URL should be cacheable at the CDN.
- Drive queries are built in `api/_lib/drive.ts`, and every value placed in a query goes through `quote`.
- Credentials are read only through `process.env` in `api/_lib/google.ts`. No new environment variables without updating `.env.example` and the Vercel project.

## Testing conventions

- Unit-test behaviour, not implementation: inputs and outputs of helpers, what a component renders and what it calls back with.
- API tests use the in-memory Drive in `api/_tests/fake-google.ts`. Component tests render through `renderWithProviders` in `src/test/render.tsx`. Mocks are typed (`vi.fn<Signature>()`).
- End-to-end tests only use the mocked API from `e2e/support/mock-api.ts` and the data in `e2e/fixtures/drive.ts`. Add fixture data rather than special-casing a test.
- The visual baselines are the specification of the UI. A change that is not meant to alter the UI must pass them untouched. When a change is meant to alter it, update them with `pnpm test:e2e --update-snapshots`, look at every changed image, and say so in the pull request.
- Tests that only make sense on one viewport are tagged `@desktop-only` or `@mobile-only`, and the Playwright projects filter on those tags.

## Dependencies

- Change dependencies and `package.json` only through pnpm (`pnpm add`, `pnpm remove`, `pnpm pkg set`). Never edit `package.json` or `pnpm-lock.yaml` by hand.
- Prefer the latest stable release. The exceptions are recorded in ARCHITECTURE.md with their reason: the pnpm pin, the `@types/node` major and the exact Mantine pin that its packages require.
- A new runtime dependency needs a reason that the platform or an existing dependency cannot cover.

## Git and pull requests

- Branch names are `<type>/<short-slug>`, for example `fix/search-paging`.
- Commits follow Conventional Commits: `type(scope): description`, imperative, at most 50 characters, subject only. Types: `feat`, `fix`, `perf`, `refactor`, `style`, `test`, `docs`, `build`, `ci`, `chore`.
- Keep commits small and self-contained, each one passing the checks above.
- Pull request titles use the same prefix with a readable summary. The description has a Description section with the context and a list of the changes, then Behaviour changes, Verification and References where they apply.
