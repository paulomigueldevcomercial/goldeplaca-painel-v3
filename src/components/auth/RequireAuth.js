import React from 'react'
import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const RequireAuth = ({ children }) => {
  const location = useLocation()
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
}

export default RequireAuth
