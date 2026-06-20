const getRuntimeConfig = () => {
  if (typeof window === 'undefined') return {}

  return window.__GOLDEPLACA_CONFIG__ ?? {}
}

export const getBackendBaseUrl = () => {
  const configuredUrl = getRuntimeConfig().BACKEND_BASE_URL?.trim() ?? ''
  return configuredUrl.replace(/\/+$/, '')
}
