import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import legacyMenuSections from './legacyMenuData'

const PainelMenu = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Mapa de menu do painel legado</strong>
          </CCardHeader>
          <CCardBody>
            {legacyMenuSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h5 className="mb-2">{section.title}</h5>
                {section.visibility && <p className="text-medium-emphasis mb-2">{section.visibility}</p>}
                <CTable align="middle" className="mb-0" hover responsive>
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell scope="col">Item</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Rota original</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Disponibilidade</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {section.items.map((item) => (
                      <CTableRow key={`${section.title}-${item.label}`}>
                        <CTableHeaderCell scope="row">{item.label}</CTableHeaderCell>
                        <CTableHeaderCell scope="row" className="text-break">
                          {item.route}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="row">{item.visibility}</CTableHeaderCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            ))}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PainelMenu
