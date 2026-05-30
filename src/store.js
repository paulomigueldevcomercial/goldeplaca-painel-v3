import { legacy_createStore as createStore } from 'redux'
import { getStoredSession } from './utils/authSession'

const storedSession = getStoredSession()

const initialState = {
  sidebarShow: true,
  theme: 'light',
  selectedCompetitionId:
    storedSession?.user?.competicaoId ||
    (typeof window !== 'undefined'
      ? window.localStorage.getItem('selectedCompetitionId') || ''
      : ''),
  auth: {
    isAuthenticated: Boolean(storedSession?.user),
    token: storedSession?.token ?? '',
    user: storedSession?.user ?? null,
  },
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      if (Object.entries(rest).every(([key, value]) => state[key] === value)) {
        return state
      }

      return { ...state, ...rest }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
