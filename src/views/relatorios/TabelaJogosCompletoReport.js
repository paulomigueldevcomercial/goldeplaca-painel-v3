import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilDescription, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import CompetitionSelect from '../../components/forms/CompetitionSelect'
import {
  excluirRelatorioCompletoJogos,
  gerarRelatorioCompletoJogos,
  listRelatoriosCompletosJogos,
} from '../../services/jogosApi'

const STATIC_REPORT_FOLDER = 'relatorio-completo-jogos'

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const getFileName = (report) => {
  const rawName = typeof report === 'string' ? report : report?.nomeArquivo
  return String(rawName || '')
    .split('/')
    .pop()
    .trim()
}

const buildReportDownloadUrl = (fileName) =>
  fileName ? `/${STATIC_REPORT_FOLDER}/${encodeURIComponent(fileName)}` : ''

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const TabelaJogosCompletoReport = () => {
  const dispatch = useDispatch()
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [deletingFileName, setDeletingFileName] = useState('')
  const [feedback, setFeedback] = useState(null)

  const competitionId = selectedCompetitionId || ''
  const normalizedCompetitionId = useMemo(() => parseNumber(competitionId), [competitionId])

  const loadReports = async (currentCompetitionId = normalizedCompetitionId) => {
    if (!currentCompetitionId) {
      setReports([])
      return
    }

    setIsLoading(true)

    try {
      const data = await listRelatoriosCompletosJogos({ competicaoId: currentCompetitionId })
      setReports(Array.isArray(data) ? data : [])
    } catch (error) {
      setReports([])
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível carregar os relatórios completos de jogos.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadReportsForCompetition = async () => {
      await Promise.resolve()
      if (!isMounted) return

      if (!normalizedCompetitionId) {
        setReports([])
        return
      }

      setIsLoading(true)

      try {
        const data = await listRelatoriosCompletosJogos({
          competicaoId: normalizedCompetitionId,
        })
        if (!isMounted) return
        setReports(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!isMounted) return
        setReports([])
        setFeedback({
          type: 'danger',
          message: error?.message || 'Não foi possível carregar os relatórios completos de jogos.',
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadReportsForCompetition()

    return () => {
      isMounted = false
    }
  }, [normalizedCompetitionId])

  const handleCompetitionChange = (value) => {
    dispatch({
      type: 'set',
      selectedCompetitionId: value,
    })
  }

  const handleGenerate = async (event) => {
    event.preventDefault()

    if (!normalizedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição para gerar o relatório.' })
      return
    }

    setIsGenerating(true)
    setFeedback(null)

    try {
      const processingResponse = await gerarRelatorioCompletoJogos({
        competicaoId: normalizedCompetitionId,
      })

      setFeedback({
        type: 'success',
        message:
          processingResponse?.mensagem ||
          'Solicitação de geração do relatório enviada para processamento.',
      })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível gerar o relatório completo de jogos.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteReport = async (fileName) => {
    if (!fileName) {
      setFeedback({ type: 'danger', message: 'Não foi possível identificar o arquivo.' })
      return
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Deseja excluir o relatório "${fileName}"?`)
    ) {
      return
    }

    setDeletingFileName(fileName)
    setFeedback(null)

    try {
      await excluirRelatorioCompletoJogos({ nomeArquivo: fileName })
      setFeedback({ type: 'success', message: 'Relatório excluído com sucesso.' })
      await loadReports()
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível excluir o relatório completo de jogos.',
      })
    } finally {
      setDeletingFileName('')
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilDescription} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Tabela de jogos completo</h4>
              <div className="text-medium-emphasis">
                Gere e baixe os PDFs completos de jogos da competição selecionada.
              </div>
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
            <strong>Gerar relatório</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="d-flex flex-column gap-3" onSubmit={handleGenerate}>
              <CompetitionSelect
                id="tabela-jogos-completo-competicao"
                label="Competição"
                placeholder="Selecione uma competição"
                value={competitionId}
                onValueChange={handleCompetitionChange}
                onError={(message) => setFeedback({ type: 'danger', message })}
              />

              <div className="d-flex flex-wrap gap-2">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={!normalizedCompetitionId || isGenerating}
                >
                  <CIcon icon={cilSave} className="me-2" />
                  {isGenerating ? 'Gerando...' : 'Gerar relatório'}
                </CButton>
                {isGenerating && <CSpinner size="sm" className="align-self-center" />}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12}>
        <CCard>
          <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <strong>Arquivos gerados</strong>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              type="button"
              disabled={!normalizedCompetitionId || isLoading}
              onClick={() => loadReports()}
            >
              <CIcon icon={cilReload} className="me-2" />
              Recarregar listagem
            </CButton>
          </CCardHeader>
          <CCardBody>
            {!normalizedCompetitionId ? (
              <div className="text-medium-emphasis">
                Selecione uma competição para listar os relatórios.
              </div>
            ) : isLoading ? (
              <div className="text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando relatórios...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-medium-emphasis">Nenhum relatório encontrado.</div>
            ) : (
              <ListPagination items={reports} summaryLabel="relatórios">
                {(paginatedReports) => (
                  <CTable hover responsive align="middle">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Arquivo</CTableHeaderCell>
                        <CTableHeaderCell>Gerado em</CTableHeaderCell>
                        <CTableHeaderCell>Ações</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {paginatedReports.map((report, index) => {
                        const fileName = getFileName(report)
                        const downloadUrl = buildReportDownloadUrl(fileName)
                        const isDeletingReport = deletingFileName === fileName

                        return (
                          <CTableRow key={`${fileName || 'relatorio'}-${index}`}>
                            <CTableDataCell className="text-break">
                              {fileName || '-'}
                            </CTableDataCell>
                            <CTableDataCell>
                              {formatDateTime(report?.dataHoraGeracao)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="d-flex flex-wrap gap-2">
                                <CButton
                                  color="success"
                                  size="sm"
                                  className="fw-semibold text-white shadow-sm"
                                  href={downloadUrl || undefined}
                                  download={fileName || undefined}
                                  disabled={!downloadUrl || isDeletingReport}
                                >
                                  <CIcon icon={cilCloudDownload} className="me-2" />
                                  Baixar
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  disabled={!fileName || Boolean(deletingFileName)}
                                  onClick={() => handleDeleteReport(fileName)}
                                >
                                  <CIcon icon={cilTrash} className="me-2" />
                                  {isDeletingReport ? 'Excluindo...' : 'Excluir'}
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                )}
              </ListPagination>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default TabelaJogosCompletoReport
