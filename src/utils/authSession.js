const AUTH_STORAGE_KEY = 'authSession'

const parseStoredSession = (value) => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (error) {
    return null
  }
}

const normalizeRoleEntries = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeRoleEntries(entry))
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

const normalizeCommaSeparatedEntries = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeCommaSeparatedEntries(entry))
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = window.atob(padded)
    return JSON.parse(decoded)
  } catch (error) {
    return null
  }
}

export const getStoredSession = () => {
  if (typeof window === 'undefined') return null
  return parseStoredSession(window.localStorage.getItem(AUTH_STORAGE_KEY))
}

export const saveSession = (session) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const getStoredToken = () => getStoredSession()?.token ?? ''

export const normalizeRoles = (value) => Array.from(new Set(normalizeRoleEntries(value)))

export const hasAdminRole = (value) => normalizeRoles(value).includes('admin')

export const normalizeMenusAllowed = (value) =>
  Array.from(new Set(normalizeCommaSeparatedEntries(value)))

export const hasAllowedMenu = (menusAllowed, alias) => {
  if (!alias) return false
  return normalizeMenusAllowed(menusAllowed).includes(String(alias).trim().toLowerCase())
}

export const buildSessionFromLogin = (response, credentials = {}) => {
  const token =
    response?.token ??
    response?.accessToken ??
    response?.access_token ??
    response?.jwt ??
    response?.authorization ??
    response?.Authorization ??
    ''

  const decodedToken = decodeJwtPayload(token)
  const responseUser = response?.user ?? response?.usuario ?? null
  const roleList = normalizeRoles(
    response?.roles ??
      response?.role ??
      response?.authorities ??
      responseUser?.roles ??
      responseUser?.role ??
      responseUser?.authorities ??
      decodedToken?.roles ??
      decodedToken?.role ??
      decodedToken?.authorities ??
      decodedToken?.scope,
  )

  const menusAllowedList = normalizeMenusAllowed(
    response?.menusAllowed ??
      response?.menus_allowed ??
      responseUser?.menusAllowed ??
      responseUser?.menus_allowed ??
      decodedToken?.menusAllowed ??
      decodedToken?.menus_allowed,
  )

  const competitionId =
    response?.competicaoId ??
    response?.competitionId ??
    response?.competicao ??
    responseUser?.competicaoId ??
    responseUser?.competitionId ??
    responseUser?.competicao ??
    decodedToken?.competicaoId ??
    decodedToken?.competitionId ??
    decodedToken?.competicao ??
    ''

  return {
    token,
    message: response?.message ?? response?.mensagem ?? '',
    user: {
      id: response?.id ?? responseUser?.id ?? decodedToken?.id ?? '',
      name:
        response?.name ?? responseUser?.name ?? decodedToken?.name ?? credentials.username ?? '',
      username:
        response?.username ??
        response?.userName ??
        responseUser?.username ??
        responseUser?.userName ??
        decodedToken?.preferred_username ??
        decodedToken?.username ??
        decodedToken?.sub ??
        credentials.username ??
        '',
      roles: roleList.join(','),
      roleList,
      menusAllowed: menusAllowedList.join(','),
      menusAllowedList,
      competicaoId: competitionId ? String(competitionId) : '',
    },
    raw: response ?? null,
  }
}
