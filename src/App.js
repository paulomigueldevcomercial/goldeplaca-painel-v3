import React, { Suspense, useCallback, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import RequireAuth from './components/auth/RequireAuth'
import { getSession } from './services/authApi'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  buildSessionFromLogin,
  clearStoredSession,
  saveSession,
} from './utils/authSession'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const dispatch = useDispatch()
  const storedTheme = useSelector((state) => state.theme)
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated)

  const resetAuthState = useCallback(() => {
    clearStoredSession()
    dispatch({
      type: 'set',
      auth: {
        isAuthenticated: false,
        token: '',
        user: null,
      },
      selectedCompetitionId: '',
    })
  }, [dispatch])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, resetAuthState)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, resetAuthState)
  }, [resetAuthState])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    let cancelled = false
    const syncSession = async () => {
      try {
        const response = await getSession()
        if (cancelled) return

        const session = buildSessionFromLogin(response)
        saveSession(session)
        dispatch({
          type: 'set',
          auth: {
            isAuthenticated: true,
            token: session.token,
            user: session.user,
          },
          selectedCompetitionId: session.user?.competicaoId || '',
        })
      } catch (error) {
        if (!cancelled && error.status === 401) {
          resetAuthState()
        }
      }
    }

    syncSession()
    const intervalId = window.setInterval(syncSession, 5 * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [dispatch, isAuthenticated, resetAuthState])

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route
            exact
            path="/login"
            name="Login Page"
            element={isAuthenticated ? <Navigate to="/painel" replace /> : <Login />}
          />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />
          <Route
            path="*"
            name="Home"
            element={
              <RequireAuth>
                <DefaultLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
