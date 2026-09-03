# Coze 旅行穿搭图片生成设计

## 目标

在现有天气分析与每日穿搭文本方案之后，为每个出行日期生成一张可直接访问的写实旅行穿搭图片。图片以目的地知名打卡地为背景，本期人物固定为成年女性，并严格呈现当天推荐的服装、鞋履和配饰。

## 现有流程与问题

当前循环体包含 `WeatherAnalysis`、`OutfitPlanner` 和 `OutfitImageGenerator`。其中 `OutfitImageGenerator` 是大模型文本节点，只输出英文图片提示词；它没有调用图片生成模型，因此结束节点的 `image_url_list[].image_url` 实际是提示词，不是 URL。

现有开始节点中的城市、日期和风格偏好参数保持不变。画布中尚未发布的修改必须保留。

## 节点设计

循环体调整为：

```text
WeatherAnalysis
  -> OutfitPlanner
  -> OutfitImageGenerator（生成图片 Prompt）
  -> TravelOutfitImage（新增图片生成节点）
  -> 循环输出 image_url_list
```

`OutfitImageGenerator` 保留现有输入，并从 `OutfitPlanner.output` 获取上衣、下装、外套、鞋子、配饰等完整方案。它只负责输出最终图片 Prompt 和穿搭理由。

`TravelOutfitImage` 使用 Coze 可用的图片生成能力：

- 输入：`OutfitImageGenerator.image_url`（现阶段该字段内容为图片 Prompt；如节点支持重命名，则改为 `image_prompt`）。
- 输出：单张图片的公开临时 URL。
- 比例：竖版 3:4；若节点仅提供预设尺寸，选择最接近 3:4 的竖版尺寸。
- 每次循环生成一张，与当前日期一一对应。

循环的 `image_url_list` 改为保存：

```json
{
  "image_url": "https://真实图片地址",
  "reasoning_content": "当天穿搭理由"
}
```

`date_list` 和 `output_list` 的结构不变，前端无需修改接口契约。

## 图片 Prompt

每一天使用以下语义模板，由节点变量插入真实值：

```text
Create one photorealistic vertical 3:4 travel street-style photograph.

Subject: one adult woman, full body visible from head to shoes, natural relaxed pose, realistic anatomy and hands, editorial travel photography, natural skin texture.

Destination: {{city}}. Place her at one visually recognizable, famous local photo spot or landmark that genuinely belongs to this destination. The landmark and local streetscape must be identifiable, but the woman and her outfit remain the main subject.

Date and weather: {{date}}, {{weather_summary}}, {{temperature_summary}}. Match the sunlight, sky, ground conditions and atmosphere to the weather.

Outfit: strictly reproduce every item and color from this plan without substituting categories or colors:
{{outfit_output}}

Style preferences: {{style_preference}}.
Color preferences: {{color_preference}}.
Occasion: {{occasion}}.
Avoid: {{avoid_items}}.

Composition: eye-level travel street photography, full-body framing, shoes fully visible, natural perspective, realistic fabric texture, coherent shadows, destination atmosphere, high detail, no collage.

Negative requirements: no cropped feet, no duplicate person, no extra limbs or fingers, no malformed hands, no floating accessories, no changed clothing colors, no text, no caption, no watermark, no logo, no celebrity likeness.
```

当可选偏好为空时，节点不得输出空变量占位符，可省略对应句子。

## 景点策略

MVP 不增加单独的联网景点检索节点。Prompt 要求模型选择真实且可辨认的当地知名打卡地，以降低节点数量、执行时间和积分消耗。同一行程多天时，优先变化取景点、机位或街区，避免重复构图。

若后续发现小众城市的地标准确率不足，再增加独立的景点检索节点，并将检索结果作为受控变量传给图片 Prompt。

## 错误与降级

- 图片生成失败不得中断天气与文字穿搭结果。
- 若 Coze 循环节点支持异常处理，图片节点失败时输出空 URL，并继续下一天。
- 前端已经具备空 URL、提示词和图片加载失败的策略图兜底。
- 图片 URL 仅用于 MVP 临时展示，不承诺长期有效，也不增加长期存储。

## 验收标准

1. 使用延边、巴黎等至少两个目的地试运行。
2. 每个日期返回一个以 `https://` 开头的图片 URL，而不是英文 Prompt。
3. 浏览器可直接打开图片 URL。
4. 图片包含一名成年女性、完整全身、当天服装和可辨认的当地背景。
5. 日期、天气、文字穿搭输出保持正常。
6. 流式 API 仍返回 `Message` 和 `Done`，前端无需更换工作流 ID。
7. 发布后通过 Cloudflare Worker 调用真实工作流，并在 H5 中直接显示图片。

