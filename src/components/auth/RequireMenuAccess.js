import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { hasAllowedMenu } from '../../utils/authSession'

const RequireMenuAccess = ({ alwaysAllowed = false, menuAlias = '', children }) => {
  const user = useSelector((state) => state.auth?.user)

  if (alwaysAllowed || hasAllowedMenu(user?.menusAllowedList ?? user?.menusAllowed, menuAlias)) {
    return children
  }

  return <Navigate to="/painel" replace />
}

RequireMenuAccess.propTypes = {
  alwaysAllowed: PropTypes.bool,
  menuAlias: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default RequireMenuAccess
