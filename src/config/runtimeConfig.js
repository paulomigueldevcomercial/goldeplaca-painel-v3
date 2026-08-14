const getRuntimeConfig = () => {
  if (typeof window === 'undefined') return {}

  return window.__GOLDEPLACA_CONFIG__ ?? {}
}

export const getBackendBaseUrl = () => {
  const configuredUrl = getRuntimeConfig().BACKEND_BASE_URL?.trim() ?? ''
  return configuredUrl.replace(/\/+$/, '')
}

export const getApcefPublicBaseUrl = () => {
  const configuredUrl = getRuntimeConfig().APCEF_PUBLIC_BASE_URL?.trim() ?? ''
  return (configuredUrl || 'https://campeonatosapcefma.com.br').replace(/\/+$/, '')
}
