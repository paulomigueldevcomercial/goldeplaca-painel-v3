import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilNotes } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import legacyMenuSections from './views/painel/legacyMenuData'

const removePainelPrefix = (path) => path.replace(/^\/painel(\/|$)/, '/')

const _nav = legacyMenuSections.flatMap((section) => [
  {
    component: CNavTitle,
    name: section.title,
  },
  ...section.items.map((item) => ({
    component: CNavItem,
    name: item.label,
    to: removePainelPrefix(item.path),
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  })),
])

export default _nav
