import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { clearStoredSession } from '../../../utils/authSession'

const Logout = () => {
  const dispatch = useDispatch()

  useEffect(() => {
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

  return <Navigate to="/login" replace />
}

export default Logout
