import React from 'react'
import { CAlert, CButton, CCard, CCardBody, CCardHeader } from '@coreui/react'

const LegacyMenuItem = ({ item }) => {
  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>{item.label}</strong>
      </CCardHeader>
      <CCardBody>
        <p className="mb-1">
          <strong>Rota original:</strong> {item.route}
        </p>
        {item.visibility && (
          <p className="mb-3 text-medium-emphasis">
            <strong>Disponibilidade:</strong> {item.visibility}
          </p>
        )}
        <CAlert color="info" className="mb-3">
          Esta tela ainda será migrada do painel legado. Use estas informações para mapear o
          comportamento e as regras de visibilidade ao reconstruir a funcionalidade.
        </CAlert>
        {item.route.startsWith('http') ? (
          <CButton color="primary" href={item.route} target="_blank" rel="noreferrer">
            Abrir link legado
          </CButton>
        ) : (
          <CButton color="primary" disabled>
            Implementação pendente ({item.route})
          </CButton>
        )}
      </CCardBody>
    </CCard>
  )
}

export default LegacyMenuItem
