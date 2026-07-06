# LaunchX Project OS

Premium local-first project operating system for LaunchX engineering.

## Current architecture

- Vite + React + TypeScript
- Production entry: `src/main.tsx`
- Production app: `src/AppLite.tsx`
- Styles: `src/styles.css`
- Local-first storage: browser `localStorage`
- Deployment: Nixpacks with Node 22

## Features

- Premium dashboard
- Project cards
- Markdown-friendly notes
- Task board
- ADR / decision log
- Weekly priorities
- Dark mode
- Responsive layout
- JSON import/export
- Keyboard shortcuts and command palette

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The app is configured for Node 22 via `package.json` and `nixpacks.toml`.
