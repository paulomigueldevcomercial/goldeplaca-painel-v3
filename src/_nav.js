import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilNotes } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import { getVisibleLegacyMenuSections } from './views/painel/legacyMenuData'
import { hasAdminRole } from './utils/authSession'

const isRestrictedItem = (item) =>
  item.route === 'user/admin' || item.route === 'gerenciador/competicao/admin'

export const buildNavigation = (roles) =>
  getVisibleLegacyMenuSections().flatMap((section) => {
    const visibleItems = section.items.filter((item) => {
      if (!isRestrictedItem(item)) return true
      return hasAdminRole(roles)
    })

    if (!visibleItems.length) return []

    return [
      {
        component: CNavTitle,
        name: section.title,
      },
      ...visibleItems.map((item) => ({
        component: CNavItem,
        name: item.label,
        to: item.path,
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
      })),
    ]
  })

export default buildNavigation
