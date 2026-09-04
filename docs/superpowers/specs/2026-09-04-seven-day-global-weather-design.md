# Seven-Day Global Weather and Parallel Outfit Design

## Goal

让 H5 在“今天至未来 7 天”范围内，为国内外目的地生成最多 7 天的真实天气旅行穿搭，并避免多日图片串行生成导致请求中断。

## Product Rules

- 旅行开始日期必须在今天至未来第 7 天之间。
- 行程总长度最多 7 天，并且结束日期不能超过未来第 7 天。
- 超出范围时在第一步直接提示，不发起 AI 请求。
- MVP 不新增长期数据库，方案仍只保存在浏览器本地。

## Architecture

Cloudflare Worker 保持现有 `/api/outfit/generate` 对前端契约不变。Worker 使用 Nominatim 将目的地解析为经纬度，再通过 Open-Meteo 获取逐日预报，规范化为 Coze 可消费的 JSON 字符串并注入工作流参数。国内外城市走同一数据链路，避免当前 Coze 天气节点对海外城市返回空数据。

Coze 工作流新增可选的 `weather_data` 输入。工作流基于已规范化的每日天气生成穿搭文本和旅行照片；每日任务应使用并发/批处理能力运行，单日图片失败只返回空图片字段，不影响其他日期及文字方案。

## Weather Contract

Worker 注入的 `weather_data` 是 JSON 字符串，解析后结构为：

```json
[
  {
    "date": "2026-09-04",
    "weather": "晴",
    "temperature_min": 12,
    "temperature_max": 26,
    "precipitation_probability": 10,
    "weather_code": 0,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "timezone": "Europe/Paris"
  }
]
```

地理编码无结果、天气服务失败或日期不在允许范围时，Worker 返回结构化中文错误，不调用 Coze。外部服务请求需带明确的 User-Agent，并保持现有 CORS 白名单。

## Frontend Behavior

日期选择和“下一步”操作都执行同一套日期规则校验。错误信息明确区分开始日期过早、超过未来 7 天、结束日期早于开始日期及行程超过 7 天。生成中沿用现有等待页；部分图片失败时仍显示文字方案和图片缺省态。

## Validation

- Worker 单元测试覆盖日期边界、城市地理编码、Open-Meteo 映射、上游失败及 Coze 参数注入。
- 前端单元测试覆盖日期规则及提交拦截。
- 类型检查、H5 构建、Worker 测试全部通过。
- 分别用国内城市与巴黎执行真实的 1 天及多天请求，验证天气非空、图片 URL 可查看、请求不再因串行执行中断。

## Deployment

先部署并验证 Worker，再发布 Coze 工作流，最后构建并推送 H5。任一真实请求失败时停止后续发布并保留当前线上可用版本。
