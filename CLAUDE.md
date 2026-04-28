# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a staffing/project-matching web app built with [Lovable](https://lovable.dev). Live app: https://project-staffing.lovable.app/

## Tech Stack

Lovable projects use the following stack by default:
- **React + TypeScript** — component-based UI
- **Tailwind CSS + shadcn/ui** — styling and component library
- **Vite** — build tool and dev server
- **Supabase** — backend (auth, database, storage) if connected

## Common Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (localhost:8080 or 5173)
npm run build      # production build
npm run lint       # lint
```

## Project Structure

```
src/
  components/      # reusable UI components
  pages/           # route-level page components
  hooks/           # custom React hooks
  lib/             # utilities and Supabase client
  types/           # TypeScript type definitions
docs/
  spec.md          # product specification
```

## Key Docs

- [Product Spec](docs/spec.md) — feature requirements and scope (generate this next)
