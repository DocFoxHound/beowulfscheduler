# Contributing to IronPoint (Beowulf Scheduler)

Thanks for your interest in contributing! This guide will help you get set up and submit high-quality changes.

## Prerequisites
- Node.js 18.18+
- npm 9+

## Getting started
1. Fork the repo and clone your fork.
2. Create a local branch: `git checkout -b feat/short-description`.
3. Copy `.env.example` to `.env.local` and configure.
4. Install dependencies: `npm install`.
5. Run the app: `npm run dev`.

## Branching model
- `main` is the stable branch.
- Use prefixes for branches:
  - `feat/*` for new features
  - `fix/*` for bug fixes
  - `docs/*` for documentation
  - `chore/*` for tooling and maintenance

## Commit convention
Use Conventional Commits to keep history readable and enable changelog tooling:

- `feat: ...` – a new feature
- `fix: ...` – a bug fix
- `docs: ...` – documentation changes
- `refactor: ...`, `perf: ...`, `style: ...`, `chore: ...`, etc.

Examples:
- `feat(scheduler): allow creating events for Prospect channel`
- `fix(leaderboards): handle empty data set gracefully`

## Code style & quality
- TypeScript first: prefer explicit types and narrow them where possible.
- Lint locally: `npm run lint`.
- Keep components small and composable; move logic into utilities or hooks where possible.
- Favor accessibility (labels, aria-attributes) and responsive layouts.

## Testing
- Add unit tests for utilities and pure functions when feasible.
- For complex flows, consider e2e tests (future addition) or at least include reproducible steps in the PR.

## Pull requests
Before opening a PR:
- Ensure the app builds: `npm run build`.
- Run linting: `npm run lint`.
- Update documentation when behavior changes (README, docs/*).
- Link the related issue and describe the problem & solution clearly.

PR checklist:
- [ ] Title uses Conventional Commits
- [ ] Description includes context and screenshots/GIFs when UI changes
- [ ] Env variables documented if added/changed
- [ ] No unrelated changes/formatting

## Reviews & merging
- A maintainer will review your PR. Address comments via follow-up commits.
- Squash merge is preferred to keep history clean.

## Reporting issues
- Use the GitHub issue templates where available.
- Include versions, environment, steps to reproduce, expected vs actual behavior, and logs/screenshots if helpful.

Thanks for contributing!
