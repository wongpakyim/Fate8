# Repository Guidelines

## Project Structure & Module Organization

- `app/` contains the Vinext/React UI, shared components, and HTTP handlers under `app/api/`.
- `lib/` is the reusable calculation layer. Keep time and four-pillar logic in `four-pillars.mjs`, shared metaphysics data in `metaphysics-core.mjs`, and system-specific logic in `liu-ren.mjs`, `qi-men.mjs`, or presentation modules.
- `scripts/bazi.mjs` exposes the CLI; `tests/*.test.mjs` contains integration and domain tests using Node's test runner.
- `config/` stores runtime rules, `data/` stores reference datasets, `public/` stores static assets, and `docs/` explains architecture and script usage.
- `db/`, `drizzle/`, and `worker/` contain persistence and hosting integration. Treat `examples/` as runnable sample input or isolated demonstrations.

## Build, Test, and Development Commands

Use Node.js 22.13+ and npm.

- `npm install` installs locked dependencies.
- `npm run dev` starts the local Vinext server.
- `npm run build` creates the production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint across JS, TS, and React code.
- `npm test` builds first, then runs all `node --test` suites.
- `npm run chart:simple -- --input examples/birth.json --format text` exercises the CLI output layer.

## Coding Style & Naming Conventions

Use ES modules, two-space indentation, semicolons, and double quotes, matching existing files. Keep TypeScript strict and avoid `any`. Use `camelCase` for values/functions, `PascalCase` for React components, kebab-case filenames such as `four-pillars.mjs`, and `*.test.mjs` for tests. Import project code through `@/*` in TypeScript where appropriate. Run `npm run lint` before committing.

## Architecture & Testing Guidelines

Calculate civil time and four pillars once; downstream BaZi, Liu Ren, and Qi Men modules must consume that shared result rather than reinterpret time independently. Keep core calculations serializable and UI-independent.

Add focused regression tests for every rule or output change. Test known chart fixtures, module boundaries, JSON/text parity, and API behavior. A change is ready only when `npm test` and `npm run lint` pass.

## Commit & Pull Request Guidelines

Follow the observed concise Conventional Commit pattern: `feat: add ...`, `fix: correct ...`, or `style: simplify ...`. Keep each commit scoped to one logical change. Pull requests should explain the behavior changed, identify affected modules, list validation performed, link relevant issues, and include screenshots for visible UI changes. Never commit secrets, local `.env` files, generated build output, or temporary chart exports.
