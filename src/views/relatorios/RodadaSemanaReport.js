import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CompetitionSelect from '../../components/forms/CompetitionSelect'
import { downloadTabelaSemanaReport } from '../../services/relatoriosApi'

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const RodadaSemanaReport = () => {
  const dispatch = useDispatch()
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const [competitionId, setCompetitionId] = useState(selectedCompetitionId || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    setCompetitionId(selectedCompetitionId || '')
  }, [selectedCompetitionId])

  const handleCompetitionChange = (value) => {
    setCompetitionId(value)
    dispatch({
      type: 'set',
      selectedCompetitionId: value,
    })
  }

  const handleDownload = async () => {
    const normalizedCompetitionId = parseNumber(competitionId)
    if (!normalizedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição para gerar o relatório.' })
      return
    }

    setIsDownloading(true)
    setFeedback(null)

    try {
      const reportBlob = await downloadTabelaSemanaReport({ competicao: normalizedCompetitionId })
      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-rodada-da-semana-${normalizedCompetitionId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível baixar o relatório da rodada da semana.',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>Relatório - Rodada da Semana</strong>
          </CCardHeader>
          <CCardBody className="d-flex flex-column gap-3">
            {feedback && (
              <CAlert color={feedback.type} className="mb-0">
                {feedback.message}
              </CAlert>
            )}

            <CompetitionSelect
              id="rodada-semana-competicao"
              label="Competição"
              placeholder="Selecione uma competição"
              value={competitionId}
              onValueChange={handleCompetitionChange}
              onError={(message) => setFeedback({ type: 'danger', message })}
            />

            <div className="d-flex gap-2">
              <CButton
                color="primary"
                disabled={!competitionId || isDownloading}
                onClick={handleDownload}
              >
                {isDownloading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Baixando...
                  </>
                ) : (
                  'Baixar PDF'
                )}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default RodadaSemanaReport
