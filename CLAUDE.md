# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Architecture

**State management via composables, not Pinia.** `src/stores/` is empty. Cross-component state lives in `src/composables/useAttendance.js` and `src/composables/useSalary.js`, each exporting a factory function (`useAttendance()`, `useSalary()`) that returns reactive refs. Components call these in their `setup()` to get isolated state — there is no singleton store.

**Data layer** (`src/db/index.js`) exports a single IndexedDB instance (`attendanceDB`) used directly by composables. Three object stores: `salary_settings` (keyPath: `id`, single record `id='primary'`), `punch_records` (keyPath: `id`, indexes on `date` and `month`), `monthly_summaries` (keyPath: `id`).

**Salary is pure day-rate, not hourly.** `utils/salary.js` → `calculateDailySalary()` returns `dailySalary` for weekdays and `dailySalary × weekendMultiplier` for weekends. The `totalSalary` field on a record can be manually overridden via the edit dialog. Do NOT change this to hourly calculation — it's an intentional design choice.

**Dark mode** is system-following (not a toggle). `main.js` listens to `prefers-color-scheme: dark` and toggles `html.dark` class. Element Plus dark CSS vars are imported. Calendar styles have explicit `html.dark .day.*` overrides.

**Route structure:** `/` (Home), `/calendar` (Calendar), `/statistics` (Statistics), `/settings` (Settings), `/*` → redirects to `/`. All components are eagerly imported in `router/index.js`.

**Date format convention:** `YYYY-MM-DD` for dates, `HH:MM` for times, `YYYY-MM` for month keys. The week starts on Monday in the calendar grid (Sunday is mapped to index 6).

## Known issues

- `src/db/index.js` `getByIndex()` lacks a `this.db` null guard (unlike `getAll()` which has one). If the DB init fails, it throws `Cannot read properties of null`.
- `el-button type="text"` in `Home.vue` and `Statistics.vue` is deprecated in Element Plus 3.0 — use `type="link"`.
- `server.log` (124MB) and `src/components/HelloWorld.vue` are safe to delete.
