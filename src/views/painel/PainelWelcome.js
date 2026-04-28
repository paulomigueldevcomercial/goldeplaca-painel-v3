import React from 'react'
import { CCard, CCardBody, CCardText, CCardTitle } from '@coreui/react'

const PainelWelcome = () => {
  return (
    <CCard>
      <CCardBody>
        <CCardTitle>Bem vindo ao painel do Gol de Placa</CCardTitle>
        <CCardText>
          Seja bem vindo ao sistema de gerenciamento do Gol de Placa, aqui voce pode gerenciar os recursos do site
        </CCardText>
      </CCardBody>
    </CCard>
  )
}

export default PainelWelcome
