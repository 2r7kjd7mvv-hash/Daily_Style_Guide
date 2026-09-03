# Coze Travel Outfit Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade workflow `7680787686953058346` so every travel date returns a directly viewable, photorealistic female travel-outfit image at a recognizable destination landmark.

**Architecture:** Keep the existing weather and outfit-planning chain intact. Convert the existing `OutfitImageGenerator` LLM node into a strict image-prompt builder, add one real image-generation node inside the daily loop, and map its public URL into the existing `image_url_list` contract. Validate in Coze first, publish only after the output contract is proven, then verify through the existing Cloudflare Worker and H5.

**Tech Stack:** Coze low-code Workflow, Coze image-generation node, Coze streaming Workflow API, Cloudflare Workers, Taro 4 H5.

**Spec:** `docs/superpowers/specs/2026-09-03-coze-travel-outfit-image-design.md`

## Global Constraints

- Preserve workflow ID `7680787686953058346` and all current start parameters.
- Preserve all currently unpublished style-parameter changes on the canvas.
- Generate one vertical 3:4 image per date, with one adult woman shown head-to-shoes.
- Use a recognizable landmark that genuinely belongs to the requested destination.
- Reproduce the planned garment categories and colors without substitution.
- Return a public temporary `https://` image URL; MVP does not add long-term image storage.
- Image failure must not remove the weather or text outfit plan; the H5 strategy-card fallback remains active.

---

### Task 1: Preserve and Inspect the Existing Workflow Contract

**Files:**
- Reference: `docs/superpowers/specs/2026-09-03-coze-travel-outfit-image-design.md`
- Inspect in Coze: workflow `7680787686953058346`, space `7477472973675446282`

**Interfaces:**
- Consumes: current Start inputs; `WeatherAnalysis` outputs; `OutfitPlanner.output`, `OutfitPlanner.image_prompt`, and `OutfitPlanner.reasoning_content`.
- Produces: a recorded pre-change mapping for `date_list`, `output_list`, and `image_url_list` that later tasks preserve.

- [ ] **Step 1: Open the workflow and confirm the unpublished-change state**

Record that the canvas shows `有尚未发布的修改`. Do not publish or delete nodes during this task.

- [ ] **Step 2: Inspect the daily loop mappings**

Open the Loop configuration and record the current sources for:

```text
date_list
output_list
image_url_list
```

- [ ] **Step 3: Inspect both image-related node prompts and output types**

Open `OutfitPlanner` and `OutfitImageGenerator`. Confirm whether `OutfitImageGenerator.image_url` is typed as String and contains prompt text rather than a generated URL.

- [ ] **Step 4: Run the current workflow once as a baseline**

Use this compact fixture to limit execution time:

```json
{
  "city": "延边朝鲜族自治州",
  "province": "吉林省",
  "towns": "延吉市",
  "villages": "延吉",
  "start_time": "2026.9.3",
  "end_time": "2026.9.3",
  "style_preference": "简约大气",
  "color_preference": "低饱和米白与卡其",
  "avoid_items": "高跟鞋",
  "occasion": "城市漫步和拍照"
}
```

Expected baseline: text weather and outfit output succeed, while `image_url_list[0].image_url` is not an `https://` URL.

---

### Task 2: Configure the Prompt Builder and Real Image Node

**Files:**
- Modify in Coze: `OutfitImageGenerator`
- Create in Coze: `TravelOutfitImage`
- Modify in Coze: daily Loop mapping

**Interfaces:**
- Consumes: `OutfitPlanner.output`, daily city/date/weather fields, and start-node style preferences.
- Produces: `TravelOutfitImage` public image URL plus the unchanged `reasoning_content`.

- [ ] **Step 1: Replace the `OutfitImageGenerator` prompt**

Configure it to emit one plain prompt string using the existing output field currently consumed as `image_url` (rename it to `image_prompt` only if Coze updates downstream mappings automatically):

```text
Create one photorealistic vertical 3:4 travel street-style photograph.

Subject: one adult woman, full body visible from head to shoes, natural relaxed pose, realistic anatomy and hands, natural skin texture, premium editorial travel photography.

Destination: {{city}}. Place her at one visually recognizable and famous local photo spot or landmark that genuinely belongs to this destination. The landmark and local streetscape must be identifiable, while the woman and her outfit remain the primary subject. For a multi-day trip, vary the landmark, street, or camera angle from other days.

Date and weather: {{date}}, {{weather_summary}}, {{temperature_summary}}. Match the sunlight, sky, ground conditions, season, and atmosphere to this weather.

Outfit: strictly reproduce every garment, shoe, accessory, material, and color in the following plan. Do not substitute categories or colors:
{{outfit_output}}

Style preference: {{style_preference}}.
Color preference: {{color_preference}}.
Occasion: {{occasion}}.
Items to avoid: {{avoid_items}}.

Composition: eye-level travel street photography, full-body framing, shoes fully visible, natural perspective, realistic fabric texture, coherent shadows, high detail, no collage.

Negative requirements: no cropped feet, no duplicate person, no child, no extra limbs or fingers, no malformed hands, no floating accessories, no changed clothing colors, no text, no caption, no watermark, no logo, no celebrity likeness.
```

- [ ] **Step 2: Verify every prompt variable mapping**

Map variables exactly as follows, using the actual field names shown by the canvas:

```text
city                <- Start.city
date                <- WeatherAnalysis.date
weather_summary     <- WeatherAnalysis.weather_summary
temperature_summary <- WeatherAnalysis.temperature_summary
outfit_output       <- OutfitPlanner.output
style_preference    <- Start.style_preference
color_preference    <- Start.color_preference
occasion            <- Start.occasion
avoid_items         <- Start.avoid_items
```

For optional empty values, configure the prompt builder to omit the corresponding sentence rather than rendering an empty placeholder.

- [ ] **Step 3: Add the real image-generation node**

Add a node named `TravelOutfitImage` immediately after `OutfitImageGenerator` inside the Loop. Select the available Coze image-generation capability that returns an image URL, configure one image, and select vertical 3:4 or the nearest available vertical size.

- [ ] **Step 4: Connect the image prompt**

Set the image node prompt input to:

```text
OutfitImageGenerator.image_prompt
```

If the existing output field remains named `image_url`, connect `OutfitImageGenerator.image_url` instead; its value at this boundary is explicitly prompt text.

- [ ] **Step 5: Update the Loop output mapping**

Make `image_url_list` append this object on each iteration:

```json
{
  "image_url": "{{TravelOutfitImage public URL}}",
  "reasoning_content": "{{OutfitImageGenerator.reasoning_content}}"
}
```

Leave `date_list` and `output_list` connected to their existing sources.

- [ ] **Step 6: Configure image-node failure handling**

If Coze exposes node exception strategy, choose the equivalent of “continue with empty output” for `TravelOutfitImage`. Do not apply a strategy that aborts the entire daily Loop.

---

### Task 3: Test, Publish, and Verify the End-to-End Contract

**Files:**
- Verify in Coze: workflow `7680787686953058346`
- Verify endpoint: `https://daily-style-guide-api.2r7kjd7mvv.workers.dev/api/outfit/generate`
- Verify H5: `https://2r7kjd7mvv-hash.github.io/Daily_Style_Guide/`

**Interfaces:**
- Consumes: the new published Coze workflow result.
- Produces: unchanged frontend JSON with real `https://` entries in `image_url_list`.

- [ ] **Step 1: Run the one-day Yanji fixture in Coze**

Reuse the exact JSON fixture from Task 1. Expected: workflow completes and returns one image URL.

- [ ] **Step 2: Inspect the generated image before publishing**

Confirm all of the following visually:

```text
one adult woman
full body and shoes visible
outfit categories and colors match output_list[0]
recognizable Yanji or Yanbian landmark/background
weather-consistent scene
no watermark or malformed anatomy
```

- [ ] **Step 3: Validate the output contract**

The End output must follow this shape:

```json
{
  "date_list": ["2026-09-03"],
  "image_url_list": [
    {
      "image_url": "https://public-image-url",
      "reasoning_content": "穿搭理由"
    }
  ],
  "output_list": [
    {
      "date": "2026-09-03",
      "city": "延边朝鲜族自治州"
    }
  ]
}
```

Expected: the actual object may contain the existing outfit fields, and `image_url` begins with `https://`.

- [ ] **Step 4: Publish the workflow**

Click `发布`, confirm API publication, and verify the published version timestamp updates. Do not change the workflow ID.

- [ ] **Step 5: Verify the streaming Worker call**

Run:

```bash
curl -sS -N --max-time 300 \
  --proxy http://127.0.0.1:7897 \
  https://daily-style-guide-api.2r7kjd7mvv.workers.dev/api/outfit/generate \
  -H 'Origin: https://2r7kjd7mvv-hash.github.io' \
  -H 'Content-Type: application/json' \
  --data '{"workflow_id":"7680787686953058346","parameters":{"city":"延边朝鲜族自治州","province":"吉林省","towns":"延吉市","villages":"延吉","start_time":"2026.9.3","end_time":"2026.9.3","style_preference":"简约大气","color_preference":"低饱和米白与卡其","avoid_items":"高跟鞋","occasion":"城市漫步和拍照"}}'
```

Expected: stream contains `event: Message`, an End payload whose `image_url_list[0].image_url` starts with `https://`, and `event: Done`.

- [ ] **Step 6: Verify the H5 result**

Generate the same one-day trip in H5. Confirm the actual travel photograph appears inside the outfit card, clicking it opens the large image, and clicking outside the image still opens the outfit detail page.

- [ ] **Step 7: Run a second-destination check**

Run a one-day Paris fixture and confirm the background changes to a recognizable Paris location while the outfit still follows that day’s output. This guards against a hard-coded Yanji scene.

