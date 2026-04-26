import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilReload, cilSave } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import { downloadSumulaFutsalReport, downloadSumulaReport } from '../../services/relatoriosApi'

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const createEmptyForm = () => ({
  id: '',
})

const reportConfigs = {
  campo: {
    pageTitle: 'Relatório - Súmula Campo',
    cardTitle: 'Gerar súmula campo',
    description: 'Informe o ID do jogo para gerar o PDF da súmula.',
    download: downloadSumulaReport,
    fileName: (reportId) => `sumula-campo-${reportId}.pdf`,
  },
  futsal: {
    pageTitle: 'Relatório - Súmula Futsal',
    cardTitle: 'Gerar súmula futsal',
    description: 'Informe o ID do jogo para gerar o PDF da súmula futsal.',
    download: downloadSumulaFutsalReport,
    fileName: (reportId) => `sumula-futsal-${reportId}.pdf`,
  },
}

const SumulaReport = ({ variant = 'campo' }) => {
  const config = reportConfigs[variant] ?? reportConfigs.campo
  const [formData, setFormData] = useState(createEmptyForm())
  const [feedback, setFeedback] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleReset = () => {
    setFormData(createEmptyForm())
    setFeedback(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    const normalizedId = parseNumber(formData.id)
    if (!normalizedId) {
      setFeedback({ type: 'danger', message: 'Informe o ID do jogo.' })
      return
    }

    setIsDownloading(true)

    try {
      const reportBlob = await config.download({ id: normalizedId })
      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = config.fileName(normalizedId)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível gerar o relatório solicitado.',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilDescription} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">{config.pageTitle}</h4>
              <div className="text-medium-emphasis">{config.description}</div>
              <SelectedCompetitionBadge className="mt-2" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}

        <CCard>
          <CCardHeader>
            <strong>{config.cardTitle}</strong>
            <div className="small text-medium-emphasis">
              Preencha o ID do jogo para baixar o PDF.
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor={`sumula-${variant}-id`}>ID do jogo</CFormLabel>
                  <CFormInput
                    id={`sumula-${variant}-id`}
                    name="id"
                    placeholder="Ex.: 125"
                    value={formData.id}
                    onChange={handleInputChange}
                    inputMode="numeric"
                  />
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isDownloading}>
                  <CIcon icon={cilSave} className="me-2" />
                  {isDownloading ? 'Gerando...' : 'Baixar PDF'}
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset}>
                  <CIcon icon={cilReload} className="me-2" />
                  Limpar
                </CButton>
                {isDownloading && <CSpinner size="sm" className="ms-2" />}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default SumulaReport
