# Daily Style Guide

基于 Taro 4、React 和 TypeScript 的旅行 AI 穿搭 H5。前端部署到 GitHub Pages，Cloudflare Worker 安全代理 Coze 流式工作流和 OpenStreetMap Nominatim 定位服务。

## 本地运行

```bash
npm install
npm run dev:h5
```

复制 `.env.example` 为 `.env`，将 `TARO_APP_API_BASE_URL` 设置为已部署的 Worker 地址。未配置时，设计流程会明确使用演示数据。

## 验证

```bash
npm test
npx tsc --noEmit
npm run build:h5
```

Worker 的 Secret 与部署步骤见 [`worker/README.md`](worker/README.md)。
