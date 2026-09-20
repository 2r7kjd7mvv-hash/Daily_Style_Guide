# Minimal Travel Outfit Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-entry consumer UI with a three-stage, mobile-first travel outfit flow while preserving the deployed weather and Coze workflow integration.

**Architecture:** Keep the Taro 4 + React 18 application, Zustand draft state, city picker, Cloudflare Worker, and Coze stream service. Add a small presentation model for multi-select preferences, rebuild only the home and plan flow, enrich forecast metadata at the existing Worker boundary, and download the generated outfit image without persisting plans or exposing legacy tabs.

**Tech Stack:** Taro 4.1.9, React 18, TypeScript, Zustand, Sass Modules, TailwindCSS 3, Framer Motion, Vitest, Cloudflare Workers, Open-Meteo, Coze workflow `7680787686953058346`.

**Spec:** `docs/superpowers/specs/2026-09-20-minimal-travel-outfit-flow-design.md`

## Global Constraints

- Continue the existing project; do not create a replacement application.
- Preserve the current Cloudflare Worker and Coze workflow call path and workflow ID.
- Keep the existing approximately 90-second real generation screen; do not simulate a three-second completion.
- Visible inputs are destination, start/end date, outfit styles, and preferred colors only.
- Outfit style and color are multi-select; color is optional and at least one style is required.
- Do not add login, registration, My, My Outfits, sharing, points, commerce, parenting, or history records.
- Do not write generated plans to LocalStorage or the current outfit persistence service.
- Remove the visible bottom tab bar and all legacy feature entry points.
- Use low-saturation Morandi colors, large rounded corners, low shadows, generous spacing, slow motion, and mobile-safe tap targets.
- Retain source files for legacy pages, but do not expose them from the new flow.

---

## File Structure

- `tailwind.config.js`: Tailwind content paths and Morandi design tokens.
- `postcss.config.js`: Tailwind and autoprefixer integration for the H5 build.
- `vitest.config.ts`: jsdom test environment and shared setup.
- `src/test/setup.ts`: DOM matchers, Taro component stubs, and cleanup.
- `src/styles/tailwind.scss`: Tailwind layers imported once by the application.
- `src/components/MotionSurface/index.tsx`: H5-only Framer Motion presentation wrappers with reduced-motion support.
- `src/features/trip/preferences.ts`: style/color option data and serialization helpers.
- `src/features/trip/preferences.test.ts`: preference selection and serialization tests.
- `src/components/PreferencePicker/index.tsx`: reusable accessible multi-select chips.
- `src/components/PreferencePicker/index.module.scss`: multi-select visual states.
- `src/components/WeatherOverview/index.tsx`: date-based weather overview cards.
- `src/components/OutfitChecklist/index.tsx`: outfit item cards with crop variants and reasons.
- `src/services/download.ts`: browser image download behavior.
- `src/services/download.test.ts`: download success/failure tests.
- `src/pages/home/*`: minimal slogan landing page.
- `src/pages/plan/*`: four-field form, retained generation state, and new result state.
- `src/store/useAppStore.ts`: style/color arrays only; remove login-dependent draft behavior from the new flow.
- `src/types/index.ts`: preference and enriched weather/result types.
- `worker/src/weather.ts`: add Open-Meteo UV index to the existing daily request.
- `worker/src/index.ts`: expose the existing forecast resolver through a read-only endpoint.
- `src/services/weather.ts`: load result-page forecast metadata without changing Coze output.
- `src/app.config.ts`: remove `tabBar` while retaining legacy page registration.

---

### Task 1: Add the H5 visual foundation and remove the visible tab bar

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/styles/tailwind.scss`
- Create: `src/components/MotionSurface/index.tsx`
- Create: `src/components/MotionSurface/index.test.tsx`
- Modify: `src/app.tsx`
- Modify: `src/app.scss`
- Modify: `src/app.config.ts`
- Create: `src/appConfig.test.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: Taro H5 application root.
- Produces: `MotionSurface`, Tailwind utility layers, shared Morandi tokens, and an app with no tab bar.

- [ ] **Step 1: Write the failing configuration and motion tests**

```tsx
it('renders motion content without changing its accessible text', () => {
  const html = renderToStaticMarkup(<MotionSurface>柔和内容</MotionSurface>);
  expect(html).toContain('柔和内容');
});

it('does not configure a bottom tab bar', async () => {
  const config = (await import('../../app.config')).default;
  expect(config).not.toHaveProperty('tabBar');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/components/MotionSurface/index.test.tsx src/appConfig.test.ts`

Expected: FAIL because `MotionSurface` is missing and `tabBar` still exists.

- [ ] **Step 3: Install the approved dependencies**

Run: `npm install framer-motion@^11 && npm install -D tailwindcss@^3 postcss@^8 autoprefixer@^10 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25`

- [ ] **Step 4: Add Tailwind tokens and the motion wrapper**

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        oat: '#F5F1E8', sage: '#839889', mist: '#AABBC8',
        latte: '#B7A38D', blush: '#C6A8A7', charcoal: '#4C5350',
      },
      borderRadius: { organic: '28px' },
      boxShadow: { soft: '0 18px 50px rgba(76,83,80,.10)' },
    },
  },
};
```

```tsx
// src/components/MotionSurface/index.tsx
import { motion, useReducedMotion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

export function MotionSurface({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

Configure Vitest with `environment: 'jsdom'` and `setupFiles: ['./src/test/setup.ts']`. Import `src/styles/tailwind.scss` from `src/app.tsx`, remove the global `.taro-tabbar__tabbar` rule, and remove the complete `tabBar` property from `src/app.config.ts`.

- [ ] **Step 5: Run focused verification**

Run: `npm test -- src/components/MotionSurface/index.test.tsx src/appConfig.test.ts && npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tailwind.config.js postcss.config.js vitest.config.ts src/test/setup.ts src/styles/tailwind.scss src/components/MotionSurface src/app.tsx src/app.scss src/app.config.ts src/appConfig.test.ts
git commit -m "feat: add minimal motion design foundation"
```

### Task 2: Model multi-select styles and Morandi colors

**Files:**
- Create: `src/features/trip/preferences.ts`
- Create: `src/features/trip/preferences.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/store/useAppStore.ts`
- Modify: `src/services/coze.test.ts`
- Modify: `src/services/coze.ts`

**Interfaces:**
- Consumes: existing `WorkflowDraft` and `WorkflowGenerateRequest`.
- Produces: `TripStyleKey`, `TripColorKey`, `TRIP_STYLE_OPTIONS`, `TRIP_COLOR_OPTIONS`, `toggleSelection<T>(values, value)`, and comma-joined workflow strings.

- [ ] **Step 1: Write failing preference and workflow serialization tests**

```ts
it('toggles a value without mutating the original selection', () => {
  const source = ['leisure'] as TripStyleKey[];
  expect(toggleSelection(source, 'photo')).toEqual(['leisure', 'photo']);
  expect(source).toEqual(['leisure']);
  expect(toggleSelection(['leisure', 'photo'], 'leisure')).toEqual(['photo']);
});

it('serializes selected styles and colors into the existing workflow fields', () => {
  const request = buildWorkflowRequest({
    destination: city,
    startDate: '2026-09-20',
    endDate: '2026-09-20',
    stylePreferences: ['休闲度假', '拍照出片'],
    colorPreferences: ['燕麦白', '雾霾蓝'],
  });
  expect(request.parameters.style_preference).toBe('休闲度假、拍照出片');
  expect(request.parameters.color_preference).toBe('燕麦白、雾霾蓝');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/trip/preferences.test.ts src/services/coze.test.ts`

Expected: FAIL because multi-select types and serialization do not exist.

- [ ] **Step 3: Implement the option model and draft state**

```ts
export const TRIP_STYLE_OPTIONS = [
  { key: 'leisure', label: '休闲度假', description: '松弛舒适，适合漫步与度假' },
  { key: 'business', label: '商务出差', description: '利落得体，兼顾通勤与会面' },
  { key: 'outdoor', label: '运动户外', description: '轻便耐走，适合长时间活动' },
  { key: 'photo', label: '拍照出片', description: '强调层次与镜头表现力' },
] as const;

export const TRIP_COLOR_OPTIONS = [
  { key: 'oat', label: '燕麦白', hex: '#E8E0D2' },
  { key: 'mist', label: '雾霾蓝', hex: '#AABBC8' },
  { key: 'sage', label: '鼠尾草绿', hex: '#A8B6A7' },
  { key: 'latte', label: '奶茶棕', hex: '#B7A38D' },
  { key: 'blush', label: '灰粉', hex: '#C6A8A7' },
  { key: 'charcoal', label: '炭灰', hex: '#666D69' },
] as const;

export function toggleSelection<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
```

Replace the store’s scalar `draftStyle`/`draftColor` with `draftStyles: TripStyleKey[]` and `draftColors: TripColorKey[]`. Keep compatibility setters only where required by the city-return flow.

- [ ] **Step 4: Update workflow serialization minimally**

```ts
style_preference: optional(draft.stylePreferences.join('、')),
color_preference: optional(draft.colorPreferences.join('、')),
```

Do not add new workflow parameter names.

- [ ] **Step 5: Run focused and type verification**

Run: `npm test -- src/features/trip/preferences.test.ts src/services/coze.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/trip src/types/index.ts src/store/useAppStore.ts src/services/coze.ts src/services/coze.test.ts
git commit -m "feat: support multi-select trip preferences"
```

### Task 3: Replace the home page with the single-action landing page

**Files:**
- Modify: `src/pages/home/index.tsx`
- Modify: `src/pages/home/index.module.scss`
- Create: `src/pages/home/index.test.tsx`

**Interfaces:**
- Consumes: `MotionSurface`, `Taro.navigateTo`.
- Produces: a home page with slogan, primary CTA, and inert history label only.

- [ ] **Step 1: Write the failing home-page test**

```tsx
it('shows only the new landing actions', () => {
  render(<HomePage />);
  expect(screen.getByText('你的专属出行穿搭助手')).toBeTruthy();
  expect(screen.getByText('开始设计我的出行穿搭')).toBeTruthy();
  expect(screen.getByText('历史方案')).toBeTruthy();
  expect(screen.queryByText('我的穿搭')).toBeNull();
  expect(screen.queryByText('最近穿搭')).toBeNull();
});

it('opens the form from the primary CTA but leaves history inert', async () => {
  fireEvent.click(screen.getByText('开始设计我的出行穿搭'));
  expect(Taro.navigateTo).toHaveBeenCalledWith({ url: '/pages/plan/index' });
  fireEvent.click(screen.getByText('历史方案'));
  expect(Taro.navigateTo).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/pages/home/index.test.tsx`

Expected: FAIL because legacy home content is still rendered.

- [ ] **Step 3: Implement the minimal home page**

Build one full-height `ScrollView`/`View` with two slow decorative blobs, the exact slogan, supporting copy limited to one short line, the exact CTA, and an inert top-right history label. Remove login, plan queries, banner, location, and legacy route handlers from this page.

```tsx
<Button className={styles.primaryCta} onClick={goPlan}>
  开始设计我的出行穿搭
</Button>
<View className={styles.historyEntry}>历史方案</View>
```

- [ ] **Step 4: Run verification**

Run: `npm test -- src/pages/home/index.test.tsx && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/home
git commit -m "feat: simplify travel outfit landing page"
```

### Task 4: Rebuild the four-field information collection page

**Files:**
- Create: `src/components/PreferencePicker/index.tsx`
- Create: `src/components/PreferencePicker/index.module.scss`
- Create: `src/components/PreferencePicker/index.test.tsx`
- Modify: `src/components/DateRangePicker/index.tsx`
- Modify: `src/components/DateRangePicker/index.module.scss`
- Modify: `src/pages/plan/planFlow.ts`
- Modify: `src/pages/plan/planFlow.test.ts`
- Modify: `src/pages/plan/index.tsx`
- Modify: `src/pages/plan/index.module.scss`

**Interfaces:**
- Consumes: option arrays and selection state from Task 2, existing city picker return parameter, existing date validation.
- Produces: `PreferencePicker<T>`, a valid four-field form, and a submit action that invokes the unchanged generation service.

- [ ] **Step 1: Write failing picker and form validation tests**

```tsx
it('highlights every selected option and reports the toggled values', () => {
  const onChange = vi.fn();
  render(<PreferencePicker options={TRIP_STYLE_OPTIONS} values={['leisure', 'photo']} onChange={onChange} />);
  expect(screen.getByText('休闲度假').closest('button')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('拍照出片').closest('button')).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByText('商务出差'));
  expect(onChange).toHaveBeenCalledWith(['leisure', 'photo', 'business']);
});

it('requires destination, dates, and at least one style but not a color', () => {
  expect(getTripStepAction({ hasDestination: true, startDate: '2026-09-20', endDate: '2026-09-20', styles: ['leisure'] }).disabled).toBe(false);
  expect(getTripStepAction({ hasDestination: true, startDate: '2026-09-20', endDate: '2026-09-20', styles: [] }).disabled).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/PreferencePicker/index.test.tsx src/pages/plan/planFlow.test.ts`

Expected: FAIL because the picker and array-aware validation are missing.

- [ ] **Step 3: Implement the generic multi-select picker**

```ts
interface PreferenceOption<T extends string> {
  key: T;
  label: string;
  description?: string;
  hex?: string;
}
```

Render real buttons with `aria-pressed`, a visible color swatch where `hex` exists, and `toggleSelection` from Task 2. Use a minimum 52px tap height.

- [ ] **Step 4: Recompose plan step one**

Retain the city picker navigation and `DateRangePicker`. Render exactly four cards in this order: destination, dates, styles, colors. Delete the three text inputs and their labels. Replace the old `StylePicker` with two `PreferencePicker` instances. Keep the maximum trip length at seven calendar days.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- src/components/PreferencePicker/index.test.tsx src/pages/plan/planFlow.test.ts src/pages/city-picker/citySelection.test.ts src/components/DateRangePicker/index.test.tsx && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PreferencePicker src/components/DateRangePicker src/pages/plan
git commit -m "feat: add four-field trip collection flow"
```

### Task 5: Restyle the real generation state without changing timing

**Files:**
- Create: `src/pages/plan/loadingState.ts`
- Create: `src/pages/plan/loadingState.test.ts`
- Modify: `src/pages/plan/index.tsx`
- Modify: `src/pages/plan/index.module.scss`

**Interfaces:**
- Consumes: existing `WorkflowStreamEvent`, `loadingIdx`, error retry callbacks, `MotionSurface`.
- Produces: `getLoadingStepIndex(event, current): number` and the slow, breathable 90-second generation UI.

- [ ] **Step 1: Write the failing progress reducer tests**

```ts
it('ignores heartbeat events and advances on workflow messages', () => {
  expect(getLoadingStepIndex({ event: 'PING', data: {} }, 2)).toBe(2);
  expect(getLoadingStepIndex({ event: 'Message', data: { node_title: '穿搭生成' } }, 2)).toBe(3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/pages/plan/loadingState.test.ts`

Expected: FAIL because the reducer does not exist.

- [ ] **Step 3: Implement progress semantics and visual motion**

Use the reducer in `onEvent`; do not use elapsed-time completion. Wrap loading copy in `MotionSurface`, render three large translucent floating shapes with 8–12 second cycles, and retain existing retry/return error actions.

- [ ] **Step 4: Run verification**

Run: `npm test -- src/pages/plan/loadingState.test.ts src/services/coze.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/plan/loadingState.ts src/pages/plan/loadingState.test.ts src/pages/plan/index.tsx src/pages/plan/index.module.scss
git commit -m "style: refresh AI generation experience"
```

### Task 6: Expose precipitation and UV through the existing weather service

**Files:**
- Modify: `worker/src/weather.ts`
- Modify: `worker/src/weather.test.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/src/index.test.ts`
- Create: `src/services/weather.ts`
- Create: `src/services/weather.test.ts`
- Modify: `src/store/useAppStore.ts`
- Modify: `src/types/index.ts`
- Modify: `src/pages/plan/index.tsx`

**Interfaces:**
- Consumes: existing Open-Meteo resolver and the same trip parameters used for generation.
- Produces: `POST /api/weather/forecast`, `getTripForecast(parameters): Promise<TripForecastDay[]>`, and `draftForecast` stored beside the in-memory generated result.

- [ ] **Step 1: Write failing weather endpoint and frontend service tests**

```ts
expect(requested.searchParams.get('daily')).toContain('uv_index_max');
expect(result[0]).toMatchObject({ precipitation_probability: 20, uv_index: 5.4, weather_code: 2 });

const response = await handleRequest(weatherRequest, env, fetcher);
expect(response.status).toBe(200);
expect(await response.json()).toEqual(expect.arrayContaining([
  expect.objectContaining({ date: '2026-09-20', precipitation_probability: 20, uv_index: 5.4 }),
]));
```

```ts
it('loads trip forecast from the Worker weather endpoint', async () => {
  const result = await getTripForecast(parameters);
  expect(result[0]).toMatchObject({ date: '2026-09-20', uv_index: 5.4 });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd worker && npm test -- src/weather.test.ts src/index.test.ts`

Run: `npm test -- src/services/weather.test.ts`

Expected: FAIL because UV is not requested and the forecast endpoint/service do not exist.

- [ ] **Step 3: Extend the existing forecast shape**

Add `uv_index: number` to `DailyForecast`, request `uv_index_max`, validate it with `requiredNumber`, and preserve the existing precipitation and weather-code behavior.

- [ ] **Step 4: Add the read-only forecast endpoint and frontend service**

Accept `POST /api/weather/forecast` with the same validated parameter object already accepted by `/api/outfit/generate`, call `resolveForecast`, and return the daily array. Do not change `/api/outfit/generate`, Coze inputs, or its workflow ID.

```ts
export async function getTripForecast(
  parameters: WorkflowGenerateRequest['parameters'],
): Promise<TripForecastDay[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/weather/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parameters }),
  });
  if (!response.ok) throw new Error('天气概览暂不可用');
  return response.json();
}
```

- [ ] **Step 5: Load forecast without blocking the existing generation result**

Start `getTripForecast(request.parameters)` before `generateOutfitPlan`; store a successful result in `draftForecast`. A forecast failure must not cancel the Coze request: the result page falls back to `DailyOutfit.weather` and `DailyOutfit.temperature`.

- [ ] **Step 6: Run Worker and frontend verification**

Run: `cd worker && npm test && npx tsc --noEmit`

Run: `npm test -- src/services/weather.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add worker/src/weather.ts worker/src/weather.test.ts worker/src/index.ts worker/src/index.test.ts src/services/weather.ts src/services/weather.test.ts src/store/useAppStore.ts src/types/index.ts src/pages/plan/index.tsx
git commit -m "feat: expose forecast details in outfit results"
```

### Task 7: Build the weather overview, strategy result, checklist, and device download

**Files:**
- Create: `src/components/WeatherOverview/index.tsx`
- Create: `src/components/WeatherOverview/index.module.scss`
- Create: `src/components/WeatherOverview/index.test.tsx`
- Create: `src/components/OutfitChecklist/index.tsx`
- Create: `src/components/OutfitChecklist/index.module.scss`
- Create: `src/components/OutfitChecklist/index.test.tsx`
- Create: `src/services/download.ts`
- Create: `src/services/download.test.ts`
- Modify: `src/pages/plan/index.tsx`
- Modify: `src/pages/plan/index.module.scss`

**Interfaces:**
- Consumes: normalized `DailyOutfit[]`, `draftForecast`, destination label, selected styles/colors.
- Produces: result composition, `downloadRemoteImage(url, filename): Promise<void>`, and reset-to-form behavior.

- [ ] **Step 1: Write failing result component tests**

```tsx
it('renders date weather temperature precipitation and UV', () => {
  render(<WeatherOverview days={[day]} />);
  expect(screen.getByText('15℃~25℃')).toBeTruthy();
  expect(screen.getByText('降水 20%')).toBeTruthy();
  expect(screen.getByText('UV 5.4')).toBeTruthy();
});

it('renders five outfit items with reasons and scene image crops', () => {
  render(<OutfitChecklist daily={day} />);
  ['上衣', '下装', '外套', '鞋履', '配饰'].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  expect(screen.getAllByRole('img')).toHaveLength(5);
});
```

- [ ] **Step 2: Write failing download tests**

```ts
it('downloads a fetched image blob with the requested filename', async () => {
  fetchMock.mockResolvedValue(new Response(new Blob(['image'], { type: 'image/jpeg' })));
  await downloadRemoteImage('https://s.coze.cn/t/example/', '延吉-穿搭.jpg');
  expect(anchor.download).toBe('延吉-穿搭.jpg');
  expect(anchor.click).toHaveBeenCalled();
});

it('rejects when no viewable image is available', async () => {
  await expect(downloadRemoteImage('', '穿搭.jpg')).rejects.toThrow('暂无可下载图片');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/components/WeatherOverview/index.test.tsx src/components/OutfitChecklist/index.test.tsx src/services/download.test.ts`

Expected: FAIL because the result components and download service do not exist.

- [ ] **Step 4: Implement result components**

Map WMO weather codes to simple inline SVG icons. Build the strategy text from `temperature`, `feeling`, `reminder`, and `reasoning_content`. Render five checklist entries using the same `image_url` with distinct `object-position` values, and use item-specific reasons such as temperature layering, walking comfort, rain/sun protection, or visual balance.

- [ ] **Step 5: Implement direct device download**

Fetch the generated image, create an object URL, click a temporary `<a download>`, then revoke the object URL in `finally`. If cross-origin fetch fails, open the generated image in a new browser tab and show “长按图片保存” rather than reporting false success.

- [ ] **Step 6: Replace plan step three**

Render `WeatherOverview`, one strategy section per active day, and `OutfitChecklist`. Remove save-to-database, share, collect, and historical navigation. Bottom actions are exactly:

```tsx
<Button onClick={handleDownload}>下载图片</Button>
<Button onClick={handleReset}>重新设计</Button>
```

Reset returns to step one while preserving the current selections and clearing only generated results/errors.

- [ ] **Step 7: Run focused verification**

Run: `npm test -- src/components/WeatherOverview/index.test.tsx src/components/OutfitChecklist/index.test.tsx src/services/download.test.ts src/pages/plan/planFlow.test.ts && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/WeatherOverview src/components/OutfitChecklist src/services/download.ts src/services/download.test.ts src/pages/plan
git commit -m "feat: add minimal outfit result and download"
```

### Task 8: Verify, deploy, and execute the requested browser acceptance path

**Files:**
- Modify if defects are found: only files already in Tasks 1–7.
- Update: `README.md` only if installation/build commands changed.

**Interfaces:**
- Consumes: completed three-page flow and deployed Worker.
- Produces: verified H5 build, deployed GitHub Pages, one real generated result, and the requested final report.

- [ ] **Step 1: Run the complete local verification suite**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npm run build:h5`

Run: `cd worker && npm test && npx tsc --noEmit`

Expected: all commands exit 0; generated `dist/` remains uncommitted.

- [ ] **Step 2: Inspect the final diff and prohibited-feature scan**

Run: `git diff --check && git status --short`

Run: `rg -n "登录|注册|我的穿搭|分享|积分|商城|保存穿搭" src/pages/home src/pages/plan`

Expected: no whitespace errors and no prohibited visible copy in the new flow.

- [ ] **Step 3: Deploy the Worker only if Task 6 changed its production bundle**

Run: `cd worker && npx wrangler deploy`

Expected: deployment succeeds for `daily-style-guide-api`; `COZE_API_TOKEN` remains a secret and is never printed.

- [ ] **Step 4: Push the reviewed branch and wait for GitHub Pages**

Run: `git push origin HEAD:main`

Run: `gh run list --limit 1`

Read the latest `databaseId` from `gh run list --limit 1 --json databaseId,status,conclusion`, then run `gh run watch 33732211710 --exit-status` after replacing `33732211710` with that returned ID.

Expected: Pages workflow succeeds.

- [ ] **Step 5: Execute browser acceptance group one**

Open the deployed URL with a cache-busting query. Verify the slogan and CTA, click the CTA and confirm navigation, click history and confirm no action.

- [ ] **Step 6: Execute browser acceptance group two**

Search and select a city, confirm the returned city text, choose a valid date range, select multiple styles and colors, verify all selected states, and submit.

- [ ] **Step 7: Execute one real workflow generation**

Keep the browser on the generation page until the published workflow returns. Verify slow motion, truthful progress, and no legacy tab bar. If the workflow fails, capture the exact error and fix only an in-scope integration defect.

- [ ] **Step 8: Execute browser acceptance group three**

Verify weather overview, temperature/icon metadata, strategy copy, generated scene image, five checklist entries/reasons, device download, and return-to-form behavior.

- [ ] **Step 9: Run final verification after any acceptance fixes**

Repeat `npm test`, `npx tsc --noEmit`, `npm run build:h5`, and affected Worker tests. Do not claim completion from an earlier run.

- [ ] **Step 10: Commit any acceptance fixes**

```bash
git add src/pages/home src/pages/plan src/components/PreferencePicker src/components/WeatherOverview src/components/OutfitChecklist src/services/download.ts src/services/download.test.ts
git commit -m "fix: resolve minimal flow acceptance issues"
```

- [ ] **Step 11: Deliver the fixed-format report**

Use exactly these headings:

```text
【修改内容】
【运行结果】
【仍未实现】
```

List historical records, login/account features, sharing, points, commerce, parenting, and independent single-item image generation under “仍未实现”.
