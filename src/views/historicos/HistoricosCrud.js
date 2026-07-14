import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilNotes, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import {
  createHistorico,
  deleteHistorico,
  listHistoricos,
  updateHistorico,
} from '../../services/historicoApi'
import { listCompeticoesHistorico } from '../../services/competicoesHistoricoApi'

const ACCEPTED_IMAGE_TYPES = '.png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif'

const HISTORICO_IMAGE_FIELDS = [
  {
    fileField: 'img_campeao',
    valueField: 'imgCampeao',
    fileNameField: 'imgCampeaoFileName',
    previewField: 'imgCampeaoPreviewUrl',
    label: 'Imagem campeão',
  },
  {
    fileField: 'img_vice_campeao',
    valueField: 'imgViceCampeao',
    fileNameField: 'imgViceCampeaoFileName',
    previewField: 'imgViceCampeaoPreviewUrl',
    label: 'Imagem vice-campeão',
  },
  {
    fileField: 'img_terceiro_lugar',
    valueField: 'imgTerceiroLugar',
    fileNameField: 'imgTerceiroLugarFileName',
    previewField: 'imgTerceiroLugarPreviewUrl',
    label: 'Imagem terceiro lugar',
  },
  {
    fileField: 'img_disciplina',
    valueField: 'imgDisciplina',
    fileNameField: 'imgDisciplinaFileName',
    previewField: 'imgDisciplinaPreviewUrl',
    label: 'Imagem disciplina',
  },
  {
    fileField: 'img_melhor_defesa',
    valueField: 'imgMelhorDefesa',
    fileNameField: 'imgMelhorDefesaFileName',
    previewField: 'imgMelhorDefesaPreviewUrl',
    label: 'Imagem melhor defesa',
  },
  {
    fileField: 'img_artilheiro',
    valueField: 'imgArtilheiro',
    fileNameField: 'imgArtilheiroFileName',
    previewField: 'imgArtilheiroPreviewUrl',
    label: 'Imagem artilheiro',
  },
]

const createEmptyHistorico = () => ({
  id: '',
  campeao: '',
  imgCampeao: '',
  viceCampeao: '',
  imgViceCampeao: '',
  terceiroLugar: '',
  imgTerceiroLugar: '',
  disciplina: '',
  imgDisciplina: '',
  melhorDefesa: '',
  imgMelhorDefesa: '',
  artilheiro: '',
  imgArtilheiro: '',
  totalGol: '0',
  totalJogos: '0',
  totalAmarelo: '0',
  totalVermelho: '0',
  totalWo: '0',
  competicaoHistorico: '',
  categoria: '',
  ano: '',
  imgCampeaoFileName: '',
  imgViceCampeaoFileName: '',
  imgTerceiroLugarFileName: '',
  imgDisciplinaFileName: '',
  imgMelhorDefesaFileName: '',
  imgArtilheiroFileName: '',
  imgCampeaoPreviewUrl: '',
  imgViceCampeaoPreviewUrl: '',
  imgTerceiroLugarPreviewUrl: '',
  imgDisciplinaPreviewUrl: '',
  imgMelhorDefesaPreviewUrl: '',
  imgArtilheiroPreviewUrl: '',
})

const NON_NEGATIVE_NUMBER_FIELDS = new Set([
  'totalGol',
  'totalJogos',
  'totalAmarelo',
  'totalVermelho',
  'totalWo',
])

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const parseNonNegativeNumber = (value) => {
  const parsed = parseNumber(value)
  if (parsed === null) return null
  return Math.max(0, parsed)
}

const normalizeNonNegativeInputValue = (value) => {
  if (value === '') return ''
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return value
  return parsed < 0 ? '0' : value
}

const normalizeNonNegativeFormValue = (value) => {
  const parsed = parseNonNegativeNumber(value)
  return String(parsed ?? 0)
}

const getCompetitionLabel = (competition) =>
  competition?.nome || `Competição ${competition?.id ?? ''}`.trim()

const getHistoricoCompetitionLabel = (historico) =>
  historico?.competicaoHistoricoNome || `Competição #${historico?.competicaoHistorico ?? ''}`.trim()

const normalizeHistoricoImageUrl = (value) => {
  const url = String(value ?? '').trim()
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  if (url.startsWith('/')) return url
  const normalizedUrl = url.replace(/^painel\//, '')
  if (normalizedUrl.startsWith('images/')) return `/${normalizedUrl}`
  if (normalizedUrl.startsWith('historico/')) return `/images/${normalizedUrl}`
  return `/images/historico/${normalizedUrl}`
}

const buildPayload = (formData, selectedId) => ({
  id: selectedId ? parseNumber(selectedId) : (parseNumber(formData.id) ?? undefined),
  campeao: formData.campeao.trim(),
  imgCampeao: formData.imgCampeao || undefined,
  viceCampeao: formData.viceCampeao.trim(),
  imgViceCampeao: formData.imgViceCampeao || undefined,
  terceiroLugar: formData.terceiroLugar.trim(),
  imgTerceiroLugar: formData.imgTerceiroLugar || undefined,
  disciplina: formData.disciplina.trim(),
  imgDisciplina: formData.imgDisciplina || undefined,
  melhorDefesa: formData.melhorDefesa.trim(),
  imgMelhorDefesa: formData.imgMelhorDefesa || undefined,
  artilheiro: formData.artilheiro.trim(),
  imgArtilheiro: formData.imgArtilheiro || undefined,
  totalGol: parseNonNegativeNumber(formData.totalGol) ?? 0,
  totalJogos: parseNonNegativeNumber(formData.totalJogos) ?? 0,
  totalAmarelo: parseNonNegativeNumber(formData.totalAmarelo) ?? 0,
  totalVermelho: parseNonNegativeNumber(formData.totalVermelho) ?? 0,
  totalWo: parseNonNegativeNumber(formData.totalWo) ?? 0,
  competicaoHistorico: parseNumber(formData.competicaoHistorico),
  categoria: formData.categoria.trim(),
  ano: parseNumber(formData.ano),
})

const HistoricosCrud = () => {
  const [historicos, setHistoricos] = useState([])
  const [historicalCompetitions, setHistoricalCompetitions] = useState([])
  const [selectedHistoricoId, setSelectedHistoricoId] = useState(null)
  const [formData, setFormData] = useState(createEmptyHistorico())
  const [imageFiles, setImageFiles] = useState({})
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false)

  const loadHistoricos = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listHistoricos()
      setHistoricos(Array.isArray(data) ? data : [])
    } catch (error) {
      setHistoricos([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os históricos.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadHistoricalCompetitions = useCallback(async () => {
    setIsLoadingCompetitions(true)
    try {
      const data = await listCompeticoesHistorico()
      setHistoricalCompetitions(Array.isArray(data) ? data : [])
    } catch (error) {
      setHistoricalCompetitions([])
      setFeedback({
        type: 'danger',
        message: 'Não foi possível carregar as competições histórico.',
      })
    } finally {
      setIsLoadingCompetitions(false)
    }
  }, [])

  useEffect(() => {
    loadHistoricos()
  }, [loadHistoricos])

  useEffect(() => {
    loadHistoricalCompetitions()
  }, [loadHistoricalCompetitions])

  const visibleHistoricos = useMemo(() => {
    const term = search.trim().toLowerCase()
    const ordered = [...historicos].sort((left, right) => {
      const leftYear = Number(left.ano ?? 0)
      const rightYear = Number(right.ano ?? 0)
      return rightYear - leftYear
    })

    if (!term) return ordered

    return ordered.filter((historico) =>
      [
        historico.ano,
        historico.categoria,
        historico.competicaoHistoricoNome,
        historico.campeao,
        historico.artilheiro,
      ].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [historicos, search])

  const resetForm = () => {
    setSelectedHistoricoId(null)
    setFormData(createEmptyHistorico())
    setImageFiles({})
    setFormErrors({})
    setFeedback(null)
  }

  const handleSelectHistorico = (historico) => {
    setSelectedHistoricoId(historico.id)
    setImageFiles({})
    setFormData({
      ...createEmptyHistorico(),
      ...historico,
      id: historico.id ?? '',
      totalGol: normalizeNonNegativeFormValue(historico.totalGol),
      totalJogos: normalizeNonNegativeFormValue(historico.totalJogos),
      totalAmarelo: normalizeNonNegativeFormValue(historico.totalAmarelo),
      totalVermelho: normalizeNonNegativeFormValue(historico.totalVermelho),
      totalWo: normalizeNonNegativeFormValue(historico.totalWo),
      competicaoHistorico:
        historico.competicaoHistorico === null || historico.competicaoHistorico === undefined
          ? ''
          : String(historico.competicaoHistorico),
    })
    setFormErrors({})
    setFeedback(null)
  }

  const hasSelectedHistoricalCompetition = historicalCompetitions.some(
    (competition) => String(competition.id) === String(formData.competicaoHistorico),
  )

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: NON_NEGATIVE_NUMBER_FIELDS.has(name) ? normalizeNonNegativeInputValue(value) : value,
    }))
    setFormErrors((previous) => {
      if (!previous[name]) return previous
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  const handleImageChange = ({ target }, config) => {
    const file = target.files?.[0]
    if (!file) return

    setImageFiles((previous) => ({
      ...previous,
      [config.fileField]: file,
    }))
    setFormData((previous) => ({
      ...previous,
      [config.fileNameField]: file.name,
      [config.previewField]: URL.createObjectURL(file),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!formData.ano) {
      nextErrors.ano = 'Informe o ano do histórico.'
    }
    if (!formData.categoria.trim()) {
      nextErrors.categoria = 'Informe a categoria do histórico.'
    }
    if (!formData.competicaoHistorico) {
      nextErrors.competicaoHistorico = 'Selecione a competição do histórico.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      setFeedback({ type: 'danger', message: 'Revise os campos obrigatórios sinalizados.' })
      return
    }

    setFormErrors({})
    setIsLoading(true)
    try {
      const payload = buildPayload(formData, selectedHistoricoId)
      const response = selectedHistoricoId
        ? await updateHistorico(selectedHistoricoId, payload, imageFiles)
        : await createHistorico(payload, imageFiles)

      await loadHistoricos()
      setSelectedHistoricoId(response?.id ?? selectedHistoricoId ?? null)
      setImageFiles({})
      setFeedback({
        type: 'success',
        message: selectedHistoricoId
          ? 'Histórico atualizado com sucesso.'
          : 'Histórico cadastrado com sucesso.',
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o histórico.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedHistoricoId) return

    setIsLoading(true)
    try {
      await deleteHistorico(selectedHistoricoId)
      await loadHistoricos()
      resetForm()
      setFeedback({ type: 'success', message: 'Histórico removido com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o histórico.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilNotes} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Histórico</h4>
              <div className="text-medium-emphasis">
                Cadastro de históricos de competições com imagens dos destaques.
              </div>
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

      <CCol lg={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Históricos</strong>
            <CButton color="primary" size="sm" variant="outline" onClick={resetForm}>
              <CIcon icon={cilPlus} className="me-2" /> Novo histórico
            </CButton>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormInput
                type="search"
                value={search}
                onChange={({ target }) => setSearch(target.value)}
                placeholder="Pesquisar por ano, categoria ou nome"
                aria-label="Pesquisar históricos"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando históricos...
              </div>
            ) : visibleHistoricos.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum histórico cadastrado.</div>
            ) : (
              <ListPagination items={visibleHistoricos} summaryLabel="históricos">
                {(paginatedHistoricos) => (
                  <CListGroup flush>
                    {paginatedHistoricos.map((historico) => (
                      <CListGroupItem
                        key={historico.id}
                        action
                        active={String(historico.id) === String(selectedHistoricoId)}
                        onClick={() => handleSelectHistorico(historico)}
                      >
                        <div className="d-flex justify-content-between gap-2">
                          <div className="text-truncate">
                            {getHistoricoCompetitionLabel(historico)}
                          </div>
                          <span className="small text-medium-emphasis">{historico.ano ?? '-'}</span>
                        </div>
                        <div className="small text-medium-emphasis">
                          Categoria: {historico.categoria || 'não informada'}
                        </div>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                )}
              </ListPagination>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={8}>
        <CCard>
          <CCardHeader>
            <strong>{selectedHistoricoId ? 'Editar histórico' : 'Novo histórico'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-ano">Ano</CFormLabel>
                  <CFormInput
                    id="historico-ano"
                    name="ano"
                    type="number"
                    value={formData.ano}
                    onChange={handleInputChange}
                    invalid={Boolean(formErrors.ano)}
                  />
                  {formErrors.ano && <CFormFeedback invalid>{formErrors.ano}</CFormFeedback>}
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-categoria">Categoria</CFormLabel>
                  <CFormInput
                    id="historico-categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    invalid={Boolean(formErrors.categoria)}
                  />
                  {formErrors.categoria && (
                    <CFormFeedback invalid>{formErrors.categoria}</CFormFeedback>
                  )}
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-competicao">Competição histórico</CFormLabel>
                  <CFormSelect
                    id="historico-competicao"
                    name="competicaoHistorico"
                    value={formData.competicaoHistorico}
                    onChange={handleInputChange}
                    disabled={isLoadingCompetitions}
                    invalid={Boolean(formErrors.competicaoHistorico)}
                  >
                    <option value="">
                      {isLoadingCompetitions ? 'Carregando competições...' : 'Selecione'}
                    </option>
                    {formData.competicaoHistorico && !hasSelectedHistoricalCompetition && (
                      <option value={formData.competicaoHistorico}>
                        Competição #{formData.competicaoHistorico}
                      </option>
                    )}
                    {historicalCompetitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {getCompetitionLabel(competition)}
                      </option>
                    ))}
                  </CFormSelect>
                  {formErrors.competicaoHistorico && (
                    <CFormFeedback invalid>{formErrors.competicaoHistorico}</CFormFeedback>
                  )}
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-campeao">Campeão</CFormLabel>
                  <CFormInput
                    id="historico-campeao"
                    name="campeao"
                    value={formData.campeao}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-vice">Vice-campeão</CFormLabel>
                  <CFormInput
                    id="historico-vice"
                    name="viceCampeao"
                    value={formData.viceCampeao}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-terceiro">Terceiro lugar</CFormLabel>
                  <CFormInput
                    id="historico-terceiro"
                    name="terceiroLugar"
                    value={formData.terceiroLugar}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-disciplina">Disciplina</CFormLabel>
                  <CFormInput
                    id="historico-disciplina"
                    name="disciplina"
                    value={formData.disciplina}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-defesa">Melhor defesa</CFormLabel>
                  <CFormInput
                    id="historico-defesa"
                    name="melhorDefesa"
                    value={formData.melhorDefesa}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="historico-artilheiro">Artilheiro</CFormLabel>
                  <CFormInput
                    id="historico-artilheiro"
                    name="artilheiro"
                    value={formData.artilheiro}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={2}>
                  <CFormLabel htmlFor="historico-gols">Gols</CFormLabel>
                  <CFormInput
                    id="historico-gols"
                    name="totalGol"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalGol}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel htmlFor="historico-jogos">Jogos</CFormLabel>
                  <CFormInput
                    id="historico-jogos"
                    name="totalJogos"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalJogos}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="historico-amarelos">Amarelos</CFormLabel>
                  <CFormInput
                    id="historico-amarelos"
                    name="totalAmarelo"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalAmarelo}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="historico-vermelhos">Vermelhos</CFormLabel>
                  <CFormInput
                    id="historico-vermelhos"
                    name="totalVermelho"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalVermelho}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel htmlFor="historico-wo">WO</CFormLabel>
                  <CFormInput
                    id="historico-wo"
                    name="totalWo"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalWo}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                {HISTORICO_IMAGE_FIELDS.map((config) => {
                  const previewUrl =
                    formData[config.previewField] ||
                    normalizeHistoricoImageUrl(formData[config.valueField])

                  return (
                    <CCol md={6} key={config.fileField}>
                      <CFormLabel htmlFor={`historico-${config.fileField}`}>
                        {config.label}
                      </CFormLabel>
                      <CFormInput
                        id={`historico-${config.fileField}`}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES}
                        onChange={(event) => handleImageChange(event, config)}
                      />
                      {formData[config.fileNameField] && (
                        <div className="form-text">
                          Arquivo selecionado: {formData[config.fileNameField]}
                        </div>
                      )}
                      {previewUrl && (
                        <div className="mt-2">
                          <img
                            src={previewUrl}
                            alt={`Prévia - ${config.label}`}
                            className="img-fluid rounded border"
                            style={{ maxHeight: '180px', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                    </CCol>
                  )
                })}
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />
                  {selectedHistoricoId ? 'Atualizar' : 'Salvar'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  disabled={!selectedHistoricoId || isLoading}
                  onClick={handleDelete}
                >
                  <CIcon icon={cilTrash} className="me-2" /> Remover
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default HistoricosCrud
