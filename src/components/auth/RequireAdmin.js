import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { hasAdminRole } from '../../utils/authSession'

const RequireAdmin = ({ children }) => {
  const user = useSelector((state) => state.auth?.user)

  if (!hasAdminRole(user?.roleList ?? user?.roles)) {
    return <Navigate to="/" replace />
  }

  return children
}

RequireAdmin.propTypes = {
  children: PropTypes.node.isRequired,
}

export default RequireAdmin
