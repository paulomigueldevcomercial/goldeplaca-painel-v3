import React from 'react'
import legacyMenuSections from './views/painel/legacyMenuData'

const PainelMenu = React.lazy(() => import('./views/painel/PainelMenu'))
const LegacyMenuItem = React.lazy(() => import('./views/painel/LegacyMenuItem'))

const legacyItems = legacyMenuSections.flatMap((section) => section.items)

const buildLegacyRoute = (item) => () => <LegacyMenuItem item={item} />

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/painel/menu', name: 'Mapa do painel', element: PainelMenu },
  ...legacyItems.map((item) => ({
    path: item.path,
    name: item.label,
    element: buildLegacyRoute(item),
  })),
]

export default routes
