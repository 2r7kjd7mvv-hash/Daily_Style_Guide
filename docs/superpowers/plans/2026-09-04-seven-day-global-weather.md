# Seven-Day Global Weather and Parallel Outfit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support real global weather and AI travel outfit images for trips fully contained within the next seven days, without multi-day request timeouts.

**Architecture:** The Cloudflare Worker geocodes the selected destination, fetches normalized Open-Meteo daily forecasts, and injects them into the existing Coze request. The frontend enforces the seven-day window before submission, while Coze consumes the normalized weather and processes daily outfit/image work concurrently.

**Tech Stack:** Taro 4, React, TypeScript, Vitest, Cloudflare Workers, Nominatim, Open-Meteo, Coze Workflow

**Spec:** `docs/superpowers/specs/2026-09-04-seven-day-global-weather-design.md`

## Global Constraints

- Start and end dates must both be between today and the seventh future calendar day, inclusive.
- Trip length must not exceed seven calendar days.
- The browser-to-Worker request contract remains backward compatible.
- No persistent server-side storage is introduced.
- A failed image must not discard a valid text outfit plan.

---

### Task 1: Frontend Date Policy

**Files:**
- Modify: `src/pages/plan/planFlow.ts`
- Modify: `src/pages/plan/planFlow.test.ts`
- Modify: `src/pages/plan/index.tsx`

**Interfaces:**
- Produces: `validateTravelDates(startDate: string, endDate: string, now?: Date): string | null`

- [ ] Add failing tests for today, day seven, past dates, dates after day seven, reversed ranges, and ranges longer than seven days.
- [ ] Run `npm test -- src/pages/plan/planFlow.test.ts` and confirm the new cases fail.
- [ ] Implement `validateTravelDates` with local-calendar comparisons and reuse it in plan submission.
- [ ] Run the focused test and confirm all cases pass.
- [ ] Commit as `feat: enforce seven-day forecast window`.

### Task 2: Worker Global Forecast Adapter

**Files:**
- Create: `worker/src/weather.ts`
- Create: `worker/src/weather.test.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/src/index.test.ts`

**Interfaces:**
- Produces: `resolveForecast(parameters, fetcher): Promise<DailyForecast[]>`
- Consumes: existing destination and date parameter strings.
- Produces: a `weather_data` JSON string injected into `parameters` before the Coze request.

- [ ] Add failing tests for date parsing, Nominatim search selection, Open-Meteo daily mapping, empty geocoding results, and forecast upstream errors.
- [ ] Run `npm test` in `worker/` and confirm the new cases fail.
- [ ] Implement the minimal geocoding and forecast adapter with encoded query parameters and an identifying User-Agent.
- [ ] Update `/api/outfit/generate` to inject normalized `weather_data` and return structured Chinese errors before calling Coze when weather resolution fails.
- [ ] Run all Worker tests and confirm they pass.
- [ ] Commit as `feat: add global seven-day weather adapter`.

### Task 3: Coze Weather Input and Parallel Daily Generation

**Files:**
- Modify in Coze UI: workflow `7680787686953058346`
- Update: `docs/superpowers/specs/2026-09-04-seven-day-global-weather-design.md` only if the actual supported concurrency primitive changes the approved interface.

**Interfaces:**
- Consumes: optional string input `weather_data` containing `DailyForecast[]` JSON.
- Produces: existing `date_list`, `output_list`, and `image_url_list` output fields.

- [ ] Add `weather_data` to the Start node and parse it into daily records.
- [ ] Replace the unsupported international weather lookup path with the provided daily records.
- [ ] Configure the daily outfit planning and image generation unit to use Coze batch/parallel execution while preserving input order.
- [ ] Keep image-node failure behavior as an empty image result so text output survives.
- [ ] Run unpublished workflow tests for Yanji and Paris across one and three days.
- [ ] Publish only after both cities return populated weather and viewable image URLs.

### Task 4: Integration Verification and Deployment

**Files:**
- Modify: `README.md` if the deployed endpoint behavior or setup instructions changed.

**Interfaces:**
- Consumes: deployed Worker and published Coze workflow.
- Produces: verified GitHub Pages H5 behavior.

- [ ] Run root `npm test`, `npx tsc --noEmit`, and `npm run build:h5`.
- [ ] Run Worker tests and `npx wrangler deploy` from `worker/`.
- [ ] Send real Worker requests for a domestic city and Paris, checking daily weather, image URL accessibility, and total duration.
- [ ] Push the frontend commit and wait for the GitHub Pages action to complete.
- [ ] Manually verify date validation, loading, results, partial-image fallback, and saved-plan navigation on the live H5.
- [ ] Record exact verification evidence in the final handoff.
