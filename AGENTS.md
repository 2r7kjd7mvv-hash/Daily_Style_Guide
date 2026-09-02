# Repository Guidelines

## Project Structure & Module Organization

This repository is a Taro 4 application built with React, TypeScript, and Sass. Application code lives in `src/`:

- `src/pages/` contains route-level screens. Each page keeps its component, Taro config, and CSS Module together as `index.tsx`, `index.config.ts`, and `index.module.scss`.
- `src/components/` contains reusable UI components using the same colocated structure.
- `src/services/` wraps cloud/API access; `src/store/` contains the Zustand application store.
- `src/data/` holds mock/static data, `src/types/` domain types, and `src/assets/` images.
- `config/` contains shared and environment-specific Taro build configuration. Global declarations are in `types/`.

Register new pages in `src/app.config.ts`. Use the `@/` alias for imports from `src`.

## Build, Test, and Development Commands

Install dependencies with `npm install`. Common commands are:

- `npm run dev:h5` — run an H5 build in watch mode.
- `npm run dev:weapp` — watch the WeChat mini-program build.
- `npm run dev:tt` — watch the Douyin mini-program build.
- `npm run build:h5` — create a production H5 bundle in `dist/`.
- `npm run build:weapp` — build the WeChat target.
- `npx tsc --noEmit` — type-check without generating files.

Equivalent scripts exist for other configured targets. Do not commit generated `dist/` output.

## Coding Style & Naming Conventions

Follow the existing style: two-space indentation, single quotes, semicolons, and trailing commas in multiline objects. Use PascalCase for components and exported types, camelCase for functions and variables, and uppercase snake case for constants. Name reusable component directories in PascalCase (`components/OutfitCard`) and page routes in kebab-case (`pages/outfit-detail`). Keep styles local in `*.module.scss`; shared tokens belong in `src/styles/`. Prefer typed service boundaries and avoid introducing new `any` values.

## Testing Guidelines

No automated test framework or coverage threshold is currently configured. Before submitting changes, run `npx tsc --noEmit` and build every platform affected. Manually verify navigation, loading/error states, and responsive styling in the relevant simulator or H5 browser. If adding tests, colocate them as `*.test.ts` or `*.test.tsx` and add the runner command to `package.json`.

## Commit & Pull Request Guidelines

Git history is not included in this checkout. Use concise, imperative commit subjects, optionally with a Conventional Commit prefix, for example `feat: add saved outfit filtering`. Keep commits focused. Pull requests should explain the change, list tested targets and commands, link issues, and include screenshots for UI changes. Call out configuration changes and platform differences.
