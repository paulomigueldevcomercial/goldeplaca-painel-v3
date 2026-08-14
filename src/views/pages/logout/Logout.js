import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../../services/authApi'
import { clearStoredSession } from '../../../utils/authSession'

const Logout = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const clearSession = async () => {
      try {
        await logout()
      } catch {
        // Local cleanup still matters if the server session is already gone.
      } finally {
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
      }
    }

    clearSession()
  }, [dispatch])

  return <Navigate to="/login" replace />
}

export default Logout
