# MITAOE Notes Drive

MITAOE Notes Drive is a read-only index of the MITAOE notes Google Drive. Students browse folders, search across every folder, preview PDFs and download files without a Google account.

## Using the site

### Browse files and folders

- Open a subject folder to see what it contains.
- The breadcrumb trail at the top shows where you are; select any part of it to go back up.
- Each file shows its name and size, with a download button next to it.
- PDFs also have a preview button that opens them in the browser, where the arrow keys move between the PDFs in the folder.

### Search for notes

1. Type keywords in the search bar and press Enter or select the search icon.
2. Search matches file and folder names across all folders.
3. Select a folder in the results to open it, or download a file directly.

### Tips

- Specific keywords find notes faster.
- Check the file size before downloading on mobile data.
- The browser back button returns to the previous folder.

### Having issues?

- Check your internet connection and refresh the page.
- Use an up-to-date browser.
- Clear the browser cache if a download does not start.

## Development

The site is a React single-page app served by Vercel, with a small set of Vercel Functions that read the Drive through the Google Drive API.

### Requirements

- The Node.js and pnpm versions pinned in `package.json` (`engines` and `packageManager`).
- Docker, for the end-to-end and visual tests.
- A Google OAuth client and refresh token with Drive access, in a `.env` file shaped like `.env.example`.

### Getting started

```sh
pnpm install
cp .env.example .env
pnpm dev
```

`pnpm dev` serves the app and the functions in `api/` together, so browsing and search work locally against the real Drive.

### Commands

| Command                  | What it does                                                     |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm dev`               | Starts the dev server with the API functions                     |
| `pnpm build`             | Type-checks and builds the production bundle into `dist/`        |
| `pnpm preview`           | Serves the production build                                      |
| `pnpm typecheck`         | Type-checks the app, the API and the tooling                     |
| `pnpm lint`              | Lints with oxlint, including type-aware rules                    |
| `pnpm format`            | Formats the codebase with oxfmt                                  |
| `pnpm format:check`      | Checks formatting without writing                                |
| `pnpm test`              | Runs the unit and component tests with Vitest                    |
| `pnpm playwright:server` | Starts the Playwright browser in Docker for the end-to-end tests |
| `pnpm playwright:wait`   | Waits until that browser accepts connections (used by CI)        |
| `pnpm test:e2e`          | Runs the visual and navigation tests against that browser        |

Run `pnpm playwright:server` in a separate terminal before `pnpm test:e2e`.

### Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) explains how the app, the API and the Drive fit together.
- [AGENTS.md](AGENTS.md) defines the folder structure, file naming and conventions for contributors and coding agents.
