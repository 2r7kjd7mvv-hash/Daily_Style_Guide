# Travel Outfit H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, mobile-first H5 experience that creates, displays, saves, filters, and revisits weather-aware AI travel outfit plans.

**Architecture:** Keep the existing Taro 4 React application and isolate external integration behind typed H5 services. GitHub Pages serves the H5 under `/Daily_Style_Guide/`; a Cloudflare Worker securely proxies Coze streaming and OpenStreetMap Nominatim reverse geocoding, while a local demo adapter keeps development usable without backend configuration. Zustand owns the draft session; saved plans persist through the existing service boundary into H5 local storage.

**Tech Stack:** Taro 4.1.9, React 18, TypeScript, Sass Modules, Zustand, Vitest, browser Fetch/ReadableStream, browser Geolocation API

**Spec:** `docs/superpowers/specs/2026-09-02-travel-outfit-h5-design.md`

## Global Constraints

- Deliver H5 only; do not add WeChat, Douyin, or other mini-program compatibility work.
- Never place a Coze access token in browser code, committed files, build constants, or client-side storage.
- Use workflow ID `7680787686953058346` only as a non-secret request identifier.
- Use two-space indentation, single quotes, semicolons, trailing commas in multiline objects, and the `@/` source alias.
- Use CSS Modules for page and component styles and shared tokens in `src/styles/`.
- Primary mobile viewport is 375px; center and cap the app surface on wider screens.
- All content screens must provide loading, error, empty, and recovery states.

---

## File Structure

- `src/types/index.ts`: domain, Coze request/response, streaming event, and generation state types.
- `src/services/coze.ts`: proxy request construction, SSE parsing, Coze payload normalization, and demo fallback.
- `src/services/location.ts`: browser geolocation and proxy reverse-geocoding adapter.
- `src/services/outfit.ts`: saved-plan queries and persistence boundary.
- `src/data/mockWorkflow.ts`: realistic stream completion fixture with displayable remote image URLs.
- `src/store/useAppStore.ts`: draft session, generated result, generation source, and reset actions.
- `src/components/EmptyState/*`: reusable travel-themed empty/error/image-placeholder state.
- `src/components/TravelTicket/*`: shared date, destination, and weather strip.
- `src/components/OutfitCard/*`: detailed result card and image failure handling.
- `src/components/OutfitMiniCard/*`: compact saved-trip summary.
- `src/components/BannerSwiper/*`: H5 hero carousel and primary action.
- `src/pages/home/*`: landing page and latest trip.
- `src/pages/plan/*`: input, streaming progress, results, save, and reset flow.
- `src/pages/outfits/*`: destination/date filters, sorting, detailed current plan, and empty results.
- `src/pages/city-picker/*`: searchable domestic/international picker plus real H5 location.
- `src/pages/mine/*`: profile, counts, saved-outfit entry, and logout.
- `src/styles/theme.scss`, `src/app.scss`: palette, typography, background, max-width shell, and safe areas.
- `src/**/*.test.ts`: focused unit tests for pure services and state-independent helpers.
- `worker/src/index.ts`: Cloudflare Worker routes for Coze streaming, Nominatim reverse geocoding, CORS, caching, and rate limits.
- `worker/wrangler.toml`, `worker/package.json`: Worker build, environment, and deployment configuration.
- `.github/workflows/deploy-pages.yml`: verified H5 build and GitHub Pages deployment.

---

### Task 1: Add a Test Harness and Typed Workflow Contract

**Files:**
- Modify: `package.json`
- Modify: `src/types/index.ts`
- Create: `src/services/coze.test.ts`
- Create: `src/services/coze.ts`
- Create: `src/data/mockWorkflow.ts`

**Interfaces:**
- Produces: `WorkflowGenerateRequest`, `WorkflowStreamEvent`, `WorkflowResultPayload`, `GenerationProgress`, `parseSseFrames(buffer)`, `normalizeWorkflowContent(content)`, and `generateOutfitPlan(input, handlers)`.
- Consumes: existing `CityInfo`, `DailyOutfit`, and `OutfitPlan`.

- [ ] **Step 1: Add Vitest and the unit-test script**

Add `"test": "vitest run"` to `scripts` and `"vitest": "^3.2.4"` to `devDependencies`, then run `npm install` so the lockfile is updated.

- [ ] **Step 2: Define exact workflow types**

Add types equivalent to:

```ts
export interface WorkflowGenerateRequest {
  workflow_id: '7680787686953058346';
  parameters: {
    city: string;
    province: string;
    towns: string;
    villages: string;
    start_time: string;
    end_time: string;
    style_preference?: string;
    color_preference?: string;
    avoid_items?: string;
    occasion?: string;
  };
}

export type WorkflowEventName = 'Message' | 'Error' | 'Interrupt' | 'PING' | 'Done';

export interface WorkflowStreamEvent {
  id?: number;
  event: WorkflowEventName;
  data: Record<string, unknown>;
}

export interface WorkflowResultPayload {
  date_list: string[];
  image_url_list: Array<string | { image_url?: string; reasoning_content?: string }>;
  output_list: DailyOutfit[];
}
```

Update `DailyOutfit.image_url` to document that it is a displayable URL, not a prompt.

- [ ] **Step 3: Write failing parser tests**

Cover a CRLF-separated SSE stream, multiple frames in one chunk, partial frames across chunks, ignored `PING`, an `Error` event, nested JSON strings in `image_url_list`, direct URL entries, missing images, and preservation of `output_list` fields. Assert that the first output item receives the first normalized image URL and reasoning content.

- [ ] **Step 4: Run the focused tests and confirm failure**

Run: `npm test -- src/services/coze.test.ts`

Expected: failure because `parseSseFrames` and `normalizeWorkflowContent` do not exist.

- [ ] **Step 5: Implement the pure parser and normalizer**

Implement `parseSseFrames` as a buffered parser that emits only complete blank-line-delimited frames and returns the unconsumed tail. Parse `event:`, `id:`, and `data:` lines without using `EventSource`, because the workflow call is a POST. Implement `normalizeWorkflowContent` with guarded `JSON.parse` calls and return a typed `DailyOutfit[]`; reject invalid top-level JSON with the user-facing message `生成结果格式异常，请重新生成`.

- [ ] **Step 6: Implement streaming generation and demo fallback**

Use `process.env.TARO_APP_API_BASE_URL` to call `${baseUrl}/api/outfit/generate`. Read `response.body` with `TextDecoder`, verify increasing event IDs when IDs are present, accumulate the final finished End-node message, and expose progress through `handlers.onEvent`. If the base URL is absent, replay `src/data/mockWorkflow.ts` with short timed progress updates and return `{ source: 'demo', dailyList }`. Do not silently fall back when a configured real endpoint returns an error.

- [ ] **Step 7: Run tests and type-check**

Run: `npm test -- src/services/coze.test.ts`

Expected: all parser and normalizer tests pass.

Run: `npx tsc --noEmit`

Expected: exit code 0.

---

### Task 2: Persist Saved Plans and Draft Generation State

**Files:**
- Modify: `src/data/mockSaveOutfit.ts`
- Modify: `src/data/mockGetOutfits.ts`
- Modify: `src/services/outfit.ts`
- Modify: `src/store/useAppStore.ts`
- Create: `src/services/outfit.test.ts`

**Interfaces:**
- Produces: `readSavedPlans()`, `writeSavedPlan(plan)`, stable `_id` values, query filtering, `generatedDailyList`, `generationSource`, and `resetDraft()`.
- Consumes: `OutfitPlan`, `DailyOutfit`, and Taro H5 storage.

- [ ] **Step 1: Write failing persistence and filter tests**

Mock the storage adapter and verify that saving prepends a plan with an ID, a later read returns it, destination keyword is case-insensitive, travel date ranges overlap correctly, creation timestamps are bounded correctly, and default ordering is `start_date` descending.

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm test -- src/services/outfit.test.ts`

Expected: failure because H5 persistence helpers are missing or current mocks always return static data.

- [ ] **Step 3: Implement local persistence through the service boundary**

Use the storage key `daily-style-guide:outfit-plans:v1`. Seed from `OUTFIT_PLAN_LIST` only when the key has never been written. Save normalized plans with `created_at`, `updated_at`, and `_id`; preserve all user-created plans across refreshes. Apply destination, trip dates, creation dates, pagination, and default travel-date-descending ordering inside `getOutfitPlans`.

- [ ] **Step 4: Extend Zustand draft state**

Add `generationSource: 'live' | 'demo' | null`, `generationError: string`, and setters. Ensure `resetDraft()` clears generated days, errors, optional preferences, and generation source while retaining sensible default dates.

- [ ] **Step 5: Verify persistence and typing**

Run: `npm test -- src/services/outfit.test.ts`

Expected: all persistence/filter tests pass.

Run: `npx tsc --noEmit`

Expected: exit code 0.

---

### Task 3: Implement H5 Location and City Recovery Paths

**Files:**
- Create: `src/services/location.ts`
- Create: `src/services/location.test.ts`
- Modify: `src/pages/city-picker/index.tsx`
- Modify: `src/pages/city-picker/index.module.scss`

**Interfaces:**
- Produces: `locateCurrentCity(): Promise<CityInfo>` and `LocationServiceError` with codes `unsupported`, `denied`, `unavailable`, `timeout`, and `reverse_geocode_failed`.
- Consumes: `process.env.TARO_APP_API_BASE_URL`, browser `navigator.geolocation`, and `CityInfo`.

- [ ] **Step 1: Write failing geolocation tests**

Stub `navigator.geolocation.getCurrentPosition` and `fetch`. Verify successful coordinates are POSTed to `/api/location/reverse`, browser denial maps to `denied`, unsupported browsers map to `unsupported`, and an invalid reverse-geocode response maps to `reverse_geocode_failed`.

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm test -- src/services/location.test.ts`

Expected: failure because `locateCurrentCity` does not exist.

- [ ] **Step 3: Implement the browser location adapter**

Request location with `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }`. Send `{ latitude, longitude }` to the configured proxy. If no proxy is configured, report that automatic city recognition is unavailable rather than pretending a default city is the real location.

- [ ] **Step 4: Replace simulated location in the city picker**

Show a loading state on “自动定位”, save successful cities to history, and display specific recovery copy: permission denial points to browser settings; missing proxy points to manual selection; timeout offers retry. Use the shared empty state for no search results and preserve domestic/international manual selection.

- [ ] **Step 5: Verify location behavior**

Run: `npm test -- src/services/location.test.ts`

Expected: all location tests pass.

Run: `npx tsc --noEmit`

Expected: exit code 0.

---

### Task 4: Build the Shared Visual System and Empty States

**Files:**
- Modify: `src/styles/theme.scss`
- Modify: `src/app.scss`
- Modify: `src/components/EmptyState/index.tsx`
- Modify: `src/components/EmptyState/index.module.scss`
- Create: `src/components/TravelTicket/index.tsx`
- Create: `src/components/TravelTicket/index.module.scss`
- Modify: `src/components/OutfitCard/index.tsx`
- Modify: `src/components/OutfitCard/index.module.scss`
- Modify: `src/components/OutfitMiniCard/index.tsx`
- Modify: `src/components/OutfitMiniCard/index.module.scss`

**Interfaces:**
- Produces: `<EmptyState variant title desc actionText onAction secondaryActionText onSecondaryAction />` and `<TravelTicket date destination weather temperature active />`.
- Consumes: `DailyOutfit` and the palette defined in the spec.

- [ ] **Step 1: Replace generic theme tokens**

Define the exact palette `#247C6D`, `#DDF1EB`, `#F6F8F6`, `#172321`, `#697673`, and `#F28C6B`. Add content max-width, safe-area, focus-visible, reduced-motion, image aspect-ratio, and shadow tokens. Remove conflicting old hard-coded green/orange values from touched component styles.

- [ ] **Step 2: Expand EmptyState into a reusable recovery component**

Support variants `trips`, `search`, `generation`, and `image`. Render an inline, lightweight travel line illustration; default the title to `暂无数据`; support zero, one, or two actions. Ensure the image variant can fit inside an outfit image frame without taking full-page spacing.

- [ ] **Step 3: Add the travel-ticket signature component**

Render weekday/date, destination, condition, and temperature with a perforated-edge treatment that communicates a real itinerary rather than decorative numbering. Keep text readable when weather fields are absent by showing `暂无数据` for the missing value.

- [ ] **Step 4: Refactor outfit cards around the shared ticket**

Use `<Image mode="aspectFill">` for valid image URLs. Track `onError` and render the image EmptyState with `图片暂未生成`; retain all text recommendations. For missing daily fields show `暂无数据` within the field instead of dropping the field. The detailed card uses a “明星穿搭解码” editorial hierarchy; the mini card remains compact.

- [ ] **Step 5: Run type-check and H5 build**

Run: `npx tsc --noEmit`

Run: `npm run build:h5`

Expected: both commands exit 0 and no generated `dist/` files are committed.

---

### Task 5: Rebuild the Three-Step AI Planning Flow

**Files:**
- Modify: `src/pages/plan/index.tsx`
- Modify: `src/pages/plan/index.module.scss`
- Modify: `src/components/StylePicker/index.tsx`
- Modify: `src/components/StylePicker/index.module.scss`
- Modify: `src/components/DateRangePicker/index.tsx`
- Modify: `src/components/DateRangePicker/index.module.scss`

**Interfaces:**
- Consumes: `generateOutfitPlan`, workflow request types, location/city draft, preference setters, `<OutfitCard>`, and `<EmptyState>`.
- Produces: validated input, visible streaming progress, results, retry/reset, and save-to-outfits navigation.

- [ ] **Step 1: Add pure form conversion tests to `src/services/coze.test.ts`**

Verify UI dates such as `2026-09-02` become `2026.9.2`; `district` maps to `towns`; a useful `villages` fallback is derived without sending `undefined`; optional preferences are trimmed; and the selected style label, not the internal key, is sent to Coze.

- [ ] **Step 2: Implement request conversion and confirm tests pass**

Add `buildWorkflowRequest(draft)` to `src/services/coze.ts` and run `npm test -- src/services/coze.test.ts`.

- [ ] **Step 3: Recompose step one**

Use compact itinerary sections for destination, date range, four default style chips, and optional color/occasion/avoid inputs. Keep destination and dates required. Validate that end date is not before start date and cap travel duration at a clear UI limit of 14 days to keep synchronous workflow execution practical.

- [ ] **Step 4: Replace timer-only loading with real stream progress**

Start with local milestones, advance based on Message events, ignore PING visually, surface Error and Interrupt as recoverable states, disable duplicate submissions, and ignore events from an obsolete request after reset/navigation. When using demo mode show `演示数据` visibly on the loading/result state.

- [ ] **Step 5: Build the result state**

Render a travel ticket and outfit card per date. If the final list is empty, show the generation EmptyState with `重新生成` and `返回修改条件`. Keep fixed bottom buttons `保存我的穿搭` and `重新设计`; save only when at least one valid daily result exists.

- [ ] **Step 6: Verify the complete planner**

Run: `npm test -- src/services/coze.test.ts`

Run: `npx tsc --noEmit`

Run: `npm run build:h5`

Expected: all commands exit 0.

---

### Task 6: Finish the Home, Saved Outfits, and Profile Experience

**Files:**
- Modify: `src/data/banners.ts`
- Modify: `src/components/BannerSwiper/index.tsx`
- Modify: `src/components/BannerSwiper/index.module.scss`
- Modify: `src/pages/home/index.tsx`
- Modify: `src/pages/home/index.module.scss`
- Modify: `src/pages/outfits/index.tsx`
- Modify: `src/pages/outfits/index.module.scss`
- Modify: `src/pages/mine/index.tsx`
- Modify: `src/pages/mine/index.module.scss`
- Modify: `src/app.config.ts`

**Interfaces:**
- Consumes: saved-plan service, `<TravelTicket>`, `<OutfitCard>`, `<OutfitMiniCard>`, and `<EmptyState>`.
- Produces: complete three-tab H5 navigation and consistent travel visual language.

- [ ] **Step 1: Rebuild the home hierarchy**

Use current/selected city at the top, a 3–4 slide portrait carousel, and place `设计我的穿搭` on the first slide. Use real travel-oriented copy and stable HTTPS image assets with a gradient fallback. Below it, show the latest upcoming/current trip; if none exists, show the trips EmptyState with the design action.

- [ ] **Step 2: Implement the saved-outfit filter model**

Search by destination and expose travel-date and creation-date filters. Default ordering is travel start date descending. Distinguish an entirely empty library from a filtered empty result: the former action is `去设计穿搭`; the latter is `清除筛选`, which resets keyword and every date field.

- [ ] **Step 3: Apply the detailed/compact list pattern**

Choose the current trip when today lies within its range; otherwise choose the nearest future trip, then the most recent past trip. Display today’s daily item when present, otherwise the first daily item. Show remaining plans as compact summaries with destination, weather, recommended clothing, and creation time.

- [ ] **Step 4: Simplify the profile page**

Keep avatar, user name/login state, saved plan/day/city counts, `我的穿搭`, `设计新穿搭`, and `退出登录`. Remove unrelated placeholders that are outside the confirmed scope. When no plans exist, show a compact empty invitation beneath the stats.

- [ ] **Step 5: Align H5 navigation and global chrome**

Keep the three tabs `首页`, `穿搭`, and `我的`; update navigation colors to the new palette. Ensure the fixed tab bar and fixed planner actions do not overlap content or mobile safe areas.

- [ ] **Step 6: Run all automated verification**

Run: `npm test`

Expected: all tests pass.

Run: `npx tsc --noEmit`

Expected: exit code 0.

Run: `npm run build:h5`

Expected: production H5 bundle completes successfully.

- [ ] **Step 7: Manually inspect critical H5 states**

Inspect at 375×812 and 1440px-wide desktop with a centered mobile surface. Verify: first-banner CTA; city manual search; location denied; planner validation; live/demo badge; streaming progress; empty AI result; broken result image; save and tab switch; empty library; filtered-empty library; nearest-trip selection; logout; keyboard focus; and reduced motion.

---

### Task 7: Add the Cloudflare Worker and GitHub Pages Delivery

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.ts`
- Create: `worker/src/index.test.ts`
- Create: `worker/README.md`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `config/index.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `POST /api/outfit/generate`, `POST /api/location/reverse`, CORS preflight handling, and the Pages deployment artifact.
- Consumes: Worker Secret `COZE_API_TOKEN`, Coze workflow ID, Nominatim, and `TARO_APP_API_BASE_URL`.

- [ ] **Step 1: Write failing Worker route tests**

Verify that disallowed origins receive no CORS access, OPTIONS returns the allowed headers, outfit requests reject malformed parameters, the Coze Authorization header uses a Worker Secret, Coze SSE bodies remain streamed, and reverse geocoding converts a Nominatim response into `CityInfo` while caching repeated coordinates.

- [ ] **Step 2: Implement the Worker routes**

Allow `https://2r7kjd7mvv-hash.github.io` plus localhost development origins. Forward validated generation requests to `https://api.coze.cn/v1/workflow/stream_run` without logging the Token. Call `https://nominatim.openstreetmap.org/reverse` with `format=jsonv2`, `accept-language=zh-CN`, and an identifying `User-Agent`; cache coordinate results and return normalized province/city/district/fullName fields.

- [ ] **Step 3: Configure deployment without secrets in files**

Document `npx wrangler secret put COZE_API_TOKEN` in `worker/README.md`. Keep `.env.example` limited to `TARO_APP_API_BASE_URL=https://<worker-name>.<account>.workers.dev`; never include a real token.

- [ ] **Step 4: Configure the GitHub Pages base path and workflow**

Set H5 `publicPath` to `/Daily_Style_Guide/` for production. Add a GitHub Actions workflow that installs with `npm ci`, runs tests, type-checks, builds H5, uploads `dist`, and deploys Pages on pushes to `main`.

- [ ] **Step 5: Verify frontend and Worker builds**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npm run build:h5`

Run from `worker/`: `npm test` and `npm run check`

Expected: every command exits 0. Live deployment requires the user to authenticate Wrangler and enter the rotated Coze token as a Worker Secret.

---

## Execution Notes

This checkout has no usable Git repository metadata. Skip commit steps unless Git metadata is restored; do not initialize a new repository without explicit user instruction. Generated `dist/` output is verification-only and must remain uncommitted.
