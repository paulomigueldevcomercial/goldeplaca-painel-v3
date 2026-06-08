import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
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
  CFormSelect,
  CFormTextarea,
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
import { cilCloudDownload, cilPencil, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import CategorySelect from '../../components/forms/CategorySelect'
import CompetitionSelect from '../../components/forms/CompetitionSelect'
import {
  createJulgamento,
  deleteJulgamento,
  downloadJulgamentoReport,
  listJulgamentos,
  updateJulgamento,
} from '../../services/julgamentosApi'

const createEmptyJulgamento = () => ({
  id: '',
  numeroProcesso: '',
  jogo: '',
  data: '',
  nomeJogador: '',
  equipe: '',
  categoria: '',
  dataAnalise: '',
  horario: '',
  ocorrencia: '',
  convocado: 'SIM',
  competicaoId: '',
  analise: '',
})

const resolveCompetitionId = (selectedCompetitionId) =>
  selectedCompetitionId === '' ||
  selectedCompetitionId === null ||
  selectedCompetitionId === undefined
    ? ''
    : String(selectedCompetitionId)

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const normalizeText = (value) => {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

const JulgamentosCrud = () => {
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const [julgamentos, setJulgamentos] = useState([])
  const [selectedJulgamentoId, setSelectedJulgamentoId] = useState(null)
  const [filters, setFilters] = useState({ convocado: 'SIM', search: '' })
  const [formData, setFormData] = useState(createEmptyJulgamento())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reportLoadingKey, setReportLoadingKey] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadJulgamentos = useCallback(async () => {
    if (!selectedCompetitionId) {
      setJulgamentos([])
      return
    }

    setIsLoading(true)
    try {
      const data = await listJulgamentos({
        competicaoId: selectedCompetitionId,
        convocado: filters.convocado || undefined,
      })
      setJulgamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      setJulgamentos([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os julgamentos.' })
    } finally {
      setIsLoading(false)
    }
  }, [filters.convocado, selectedCompetitionId])

  useEffect(() => {
    setSelectedJulgamentoId(null)
    setFormData((previous) => ({
      ...createEmptyJulgamento(),
      competicaoId: resolveCompetitionId(selectedCompetitionId),
      convocado: previous.convocado || 'SIM',
    }))
    setFilters({ convocado: 'SIM', search: '' })
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    loadJulgamentos()
  }, [loadJulgamentos])

  useEffect(() => {
    if (!selectedJulgamentoId) return
    const julgamento = julgamentos.find((item) => String(item.id) === String(selectedJulgamentoId))
    if (!julgamento) return

    setFormData({
      ...createEmptyJulgamento(),
      ...julgamento,
      id: julgamento.id ?? '',
      jogo: julgamento.jogo ?? '',
      data: julgamento.data ?? '',
      dataAnalise: julgamento.dataAnalise ?? '',
      convocado: julgamento.convocado || 'SIM',
      competicaoId: resolveCompetitionId(julgamento.competicaoId ?? selectedCompetitionId),
    })
  }, [julgamentos, selectedCompetitionId, selectedJulgamentoId])

  const visibleJulgamentos = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    if (!search) return julgamentos

    return julgamentos.filter((item) =>
      [item.numeroProcesso, item.nomeJogador, item.equipe].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(search),
      ),
    )
  }, [filters.search, julgamentos])

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSelectJulgamento = (id) => {
    setSelectedJulgamentoId(id)
    setFeedback(null)
  }

  const handleFormCompetitionChange = (value) => {
    setFormData((previous) => ({ ...previous, competicaoId: value, categoria: '' }))
  }

  const handleResetForm = () => {
    setSelectedJulgamentoId(null)
    setFormData((previous) => ({
      ...createEmptyJulgamento(),
      competicaoId: resolveCompetitionId(selectedCompetitionId),
      convocado: previous.convocado || 'SIM',
    }))
    setFeedback(null)
  }

  const handleDelete = async (id) => {
    if (!id) return

    setIsLoading(true)
    try {
      await deleteJulgamento(id)
      if (String(selectedJulgamentoId) === String(id)) {
        setSelectedJulgamentoId(null)
        setFormData((previous) => ({
          ...createEmptyJulgamento(),
          competicaoId: resolveCompetitionId(selectedCompetitionId),
          convocado: previous.convocado || 'SIM',
        }))
      }
      setFeedback({ type: 'success', message: 'Julgamento removido com sucesso.' })
      await loadJulgamentos()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o julgamento.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.competicaoId) {
      setFeedback({ type: 'danger', message: 'Selecione a competição do julgamento.' })
      return
    }

    if (!formData.numeroProcesso || !formData.nomeJogador) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios do julgamento.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const payload = {
        id: parseNumber(formData.id),
        numeroProcesso: normalizeText(formData.numeroProcesso),
        jogo: parseNumber(formData.jogo),
        data: normalizeText(formData.data),
        nomeJogador: normalizeText(formData.nomeJogador),
        equipe: normalizeText(formData.equipe),
        categoria: normalizeText(formData.categoria),
        dataAnalise: normalizeText(formData.dataAnalise),
        horario: normalizeText(formData.horario),
        ocorrencia: normalizeText(formData.ocorrencia),
        convocado: normalizeText(formData.convocado) || 'SIM',
        competicaoId: parseNumber(formData.competicaoId),
        analise: normalizeText(formData.analise),
      }

      if (selectedJulgamentoId) {
        await updateJulgamento(selectedJulgamentoId, payload)
        setFeedback({ type: 'success', message: 'Julgamento atualizado com sucesso.' })
      } else {
        const created = await createJulgamento(payload)
        setSelectedJulgamentoId(created?.id ?? null)
        setFeedback({ type: 'success', message: 'Julgamento cadastrado com sucesso.' })
      }

      await loadJulgamentos()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o julgamento.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilPlus} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Julgamentos</h4>
              <div className="text-medium-emphasis">
                Cadastre, edite e acompanhe julgamentos da competição selecionada.
              </div>
              <SelectedCompetitionBadge className="mt-2" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {feedback && (
        <CCol xs={12}>
          <CAlert color={feedback.type} className="mb-0">
            {feedback.message}
          </CAlert>
        </CCol>
      )}

      <CCol lg={7}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Listagem de julgamentos</strong>
          </CCardHeader>
          <CCardBody className="d-flex flex-column gap-3">
            {!selectedCompetitionId && (
              <CAlert color="info" className="mb-0">
                Selecione uma competição no menu lateral para listar os julgamentos.
              </CAlert>
            )}

            <CRow className="g-3">
              <CCol md={4}>
                <CFormLabel htmlFor="filter-convocado">Convocado</CFormLabel>
                <CFormSelect
                  id="filter-convocado"
                  value={filters.convocado}
                  onChange={({ target }) =>
                    setFilters((previous) => ({ ...previous, convocado: target.value }))
                  }
                  disabled={!selectedCompetitionId}
                >
                  <option value="">Todos</option>
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                </CFormSelect>
              </CCol>
              <CCol md={8}>
                <CFormLabel htmlFor="filter-search">Pesquisar</CFormLabel>
                <CFormInput
                  id="filter-search"
                  value={filters.search}
                  onChange={({ target }) =>
                    setFilters((previous) => ({ ...previous, search: target.value }))
                  }
                  placeholder="Processo, jogador ou equipe"
                  disabled={!selectedCompetitionId}
                />
              </CCol>
            </CRow>

            <div className="d-flex gap-2">
              <CButton
                color="primary"
                variant="outline"
                disabled={!selectedCompetitionId || isLoading}
                onClick={loadJulgamentos}
              >
                <CIcon icon={cilReload} className="me-2" />
                {isLoading ? 'Atualizando...' : 'Atualizar lista'}
              </CButton>
            </div>

            {isLoading ? (
              <div className="text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando julgamentos...
              </div>
            ) : visibleJulgamentos.length === 0 ? (
              <div className="text-medium-emphasis">Nenhum julgamento encontrado.</div>
            ) : (
              <ListPagination items={visibleJulgamentos} summaryLabel="julgamentos">
                {(paginatedJulgamentos) => (
                  <CTable hover responsive align="middle">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Processo</CTableHeaderCell>
                        <CTableHeaderCell>Jogador</CTableHeaderCell>
                        <CTableHeaderCell>Equipe</CTableHeaderCell>
                        <CTableHeaderCell>Análise</CTableHeaderCell>
                        <CTableHeaderCell>Convocado</CTableHeaderCell>
                        <CTableHeaderCell>Ações</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {paginatedJulgamentos.map((julgamento) => (
                        <CTableRow key={julgamento.id ?? julgamento.numeroProcesso}>
                          <CTableDataCell>{julgamento.numeroProcesso || '-'}</CTableDataCell>
                          <CTableDataCell>{julgamento.nomeJogador || '-'}</CTableDataCell>
                          <CTableDataCell>{julgamento.equipe || '-'}</CTableDataCell>
                          <CTableDataCell>{formatDate(julgamento.dataAnalise)}</CTableDataCell>
                          <CTableDataCell>{julgamento.convocado || '-'}</CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex flex-wrap gap-2">
                              <CButton
                                color="primary"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectJulgamento(julgamento.id)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="success"
                                size="sm"
                                className="fw-semibold text-white shadow-sm"
                                disabled={
                                  !String(julgamento.numeroProcesso || '').trim() ||
                                  reportLoadingKey === `report-${julgamento.id}`
                                }
                                onClick={async () => {
                                  const currentReportKey = `report-${julgamento.id}`
                                  setReportLoadingKey(currentReportKey)
                                  try {
                                    const reportBlob = await downloadJulgamentoReport({
                                      numeroProcesso: julgamento.numeroProcesso,
                                    })
                                    const url = window.URL.createObjectURL(reportBlob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = `relatorio-julgamento-${julgamento.numeroProcesso}.pdf`
                                    document.body.appendChild(link)
                                    link.click()
                                    link.remove()
                                    window.URL.revokeObjectURL(url)
                                  } catch (error) {
                                    setFeedback({
                                      type: 'danger',
                                      message: 'Não foi possível baixar o relatório de julgamento.',
                                    })
                                  } finally {
                                    setReportLoadingKey(null)
                                  }
                                }}
                              >
                                {reportLoadingKey === `report-${julgamento.id}` ? (
                                  <CSpinner size="sm" />
                                ) : (
                                  <CIcon icon={cilCloudDownload} />
                                )}
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(julgamento.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                )}
              </ListPagination>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={5}>
        <CCard>
          <CCardHeader>
            <strong>{selectedJulgamentoId ? 'Editar julgamento' : 'Novo julgamento'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="julgamento-processo">Nº processo</CFormLabel>
                  <CFormInput
                    id="julgamento-processo"
                    name="numeroProcesso"
                    value={formData.numeroProcesso}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="julgamento-jogo">Jogo</CFormLabel>
                  <CFormInput
                    id="julgamento-jogo"
                    name="jogo"
                    type="number"
                    value={formData.jogo}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="julgamento-jogador">Nome do jogador</CFormLabel>
                  <CFormInput
                    id="julgamento-jogador"
                    name="nomeJogador"
                    value={formData.nomeJogador}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="julgamento-equipe">Equipe</CFormLabel>
                  <CFormInput
                    id="julgamento-equipe"
                    name="equipe"
                    value={formData.equipe}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CategorySelect
                    id="julgamento-categoria"
                    name="categoria"
                    label="Categoria"
                    competitionId={formData.competicaoId}
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData((previous) => ({ ...previous, categoria: value }))
                    }
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="julgamento-convocado">Convocado</CFormLabel>
                  <CFormSelect
                    id="julgamento-convocado"
                    name="convocado"
                    value={formData.convocado}
                    onChange={handleInputChange}
                  >
                    <option value="SIM">Sim</option>
                    <option value="NAO">Não</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="julgamento-data">Data da ocorrência</CFormLabel>
                  <CFormInput
                    id="julgamento-data"
                    name="data"
                    type="date"
                    value={formData.data}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="julgamento-data-analise">Data da análise</CFormLabel>
                  <CFormInput
                    id="julgamento-data-analise"
                    name="dataAnalise"
                    type="date"
                    value={formData.dataAnalise}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="julgamento-horario">Horário</CFormLabel>
                  <CFormInput
                    id="julgamento-horario"
                    name="horario"
                    value={formData.horario}
                    onChange={handleInputChange}
                    placeholder="Ex.: 19:30"
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="julgamento-ocorrencia">Ocorrência</CFormLabel>
                <CFormTextarea
                  id="julgamento-ocorrencia"
                  name="ocorrencia"
                  rows={3}
                  value={formData.ocorrencia}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <CFormLabel htmlFor="julgamento-analise">Análise</CFormLabel>
                <CFormTextarea
                  id="julgamento-analise"
                  name="analise"
                  rows={4}
                  value={formData.analise}
                  onChange={handleInputChange}
                />
              </div>

              <CompetitionSelect
                id="julgamento-competicao"
                name="competicaoId"
                label="Competição"
                value={formData.competicaoId}
                onValueChange={handleFormCompetitionChange}
                autoSelectFirst={false}
              />

              <div className="d-flex gap-2">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={isSaving || !formData.competicaoId}
                >
                  <CIcon icon={cilSave} className="me-2" />
                  {isSaving
                    ? selectedJulgamentoId
                      ? 'Atualizando...'
                      : 'Salvando...'
                    : selectedJulgamentoId
                      ? 'Atualizar'
                      : 'Salvar'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={handleResetForm}
                >
                  <CIcon icon={cilReload} className="me-2" /> Novo
                </CButton>
                {selectedJulgamentoId && (
                  <CButton
                    color="danger"
                    variant="ghost"
                    type="button"
                    onClick={() => handleDelete(selectedJulgamentoId)}
                  >
                    <CIcon icon={cilTrash} className="me-2" /> Excluir
                  </CButton>
                )}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default JulgamentosCrud
