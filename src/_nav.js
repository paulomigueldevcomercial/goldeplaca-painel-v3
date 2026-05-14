import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilNotes } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import { getVisibleLegacyMenuSectionsForAccess } from './views/painel/legacyMenuData'

export const buildNavigation = (roles, menusAllowed) =>
  getVisibleLegacyMenuSectionsForAccess(roles, menusAllowed).flatMap((section) => [
    {
      component: CNavTitle,
      name: section.title,
    },
    ...section.items.map((item) => ({
      component: CNavItem,
      name: item.label,
      to: item.path,
      icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    })),
  ])

export default buildNavigation
