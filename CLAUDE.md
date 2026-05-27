# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page web app (Portuguese / PT-BR) that scores SDR candidate interviews against a weighted rubric and generates an AI-written evaluation report. Deployed on Vercel as a static `index.html` plus one serverless function.

## Architecture

Two files do all the work:

- **`index.html`** — the entire application. Plain HTML/CSS + a single inline `<script>` (no build step, no framework, no bundler). It renders the form panel and live score panel by hand from a `CATS` array of weighted categories and questions (`Experiência`, `Disciplina e Organização`, etc.). Score is computed client-side as a weighted sum of Sim/Não/N/A answers. When the user clicks "Gerar Relatório", the client POSTs the assembled prompt to `/api/ai`.
- **`api/ai.js`** — a thin Vercel Function (Node, CommonJS) that proxies the client's JSON body to `https://api.anthropic.com/v1/messages` using the server-side `ANTHROPIC_API_KEY`. It exists solely to keep the Anthropic key off the client. CORS is wide open (`*`).

There is no router, no state library, no database. All session state lives in DOM/JS memory until the report is generated.

## Conventions

- **No build step.** Edit `index.html` directly. Do not introduce a bundler, framework, or package manager dependencies unless explicitly asked — `package.json` deliberately has no `dependencies` and only pins Node 24.x for Vercel.
- **All UI strings are PT-BR.** Preserve language when adding copy.
- **Brand tokens** are defined at the top of the script: `GM.orange = #F96500`, `GM.dark = #222223`, `GM.yellow = #FF7D12`. Use these rather than hardcoding hex.
- **Rubric edits** (adding/removing/reweighting questions) happen in the `CATS` array. Each question has `id`, `w` (weight), `txt`, and optional `tag`. Category-level `weight` multiplies into the final score, so changing weights affects historical comparability.

## Deployment

- Hosted on Vercel. `vercel.json` is intentionally empty (`{}`) — Vercel auto-detects `api/*.js` as Functions and serves `index.html` statically.
- Required env var on Vercel: `ANTHROPIC_API_KEY`. The function returns 500 with a PT-BR message if it's missing.
- Local preview: `vercel dev` (no npm scripts are defined).
