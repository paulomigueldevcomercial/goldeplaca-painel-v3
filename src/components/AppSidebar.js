import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'
import CompetitionSelect from './forms/CompetitionSelect'
import { hasAdminRole } from '../utils/authSession'

// sidebar nav config
import buildNavigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const authUser = useSelector((state) => state.auth?.user)
  const navigation = buildNavigation(
    authUser?.roleList ?? authUser?.roles,
    authUser?.menusAllowedList ?? authUser?.menusAllowed,
  )
  const isAdmin = hasAdminRole(authUser?.roleList ?? authUser?.roles)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('selectedCompetitionId', selectedCompetitionId || '')
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!authUser?.competicaoId || selectedCompetitionId) return
    dispatch({ type: 'set', selectedCompetitionId: authUser.competicaoId })
  }, [authUser?.competicaoId, dispatch, selectedCompetitionId])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        if (visible === sidebarShow) return
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/painel">
          <span className="sidebar-brand-text">Painel - Gol de Placa MA</span>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <div className="px-3 py-3 border-bottom">
        <CompetitionSelect
          label="Competição selecionada"
          placeholder="Selecione"
          value={selectedCompetitionId}
          onValueChange={(competitionId) =>
            dispatch({
              type: 'set',
              selectedCompetitionId: competitionId,
            })
          }
          size="sm"
          ariaLabel="Selecionar competição"
          disabled={!authUser || (!isAdmin && Boolean(authUser?.competicaoId))}
        />
      </div>
      <AppSidebarNav items={navigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
