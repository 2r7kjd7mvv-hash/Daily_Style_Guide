interface RuntimeProcessLike {
  env?: {
    TARO_APP_API_BASE_URL?: string;
  };
}

export function resolveApiBaseUrl(runtimeProcess?: RuntimeProcessLike) {
  return (runtimeProcess?.env?.TARO_APP_API_BASE_URL || '').replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl({
    env: { TARO_APP_API_BASE_URL: TARO_APP_API_BASE_URL },
  });
}
