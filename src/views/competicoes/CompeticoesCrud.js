import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilSettings, cilTrash } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import {
  createCompeticao,
  deleteCompeticao,
  listCompeticoes,
  updateCompeticao,
} from '../../services/competicaoApi'

const createEmptyCompetition = () => ({
  id: '',
  descricao: '',
  nomeCompeticao: '',
  modalidadeId: '',
  maxInscricoes: '',
  dataInicio: '',
  dataFim: '',
  empresaId: '',
  temporada: '',
  foto: '',
  imagemEmpresa: '',
  finalizado: false,
  ativo: true,
  coordenacaoTelefone: '',
  coordenacaoNome: '',
  vicePresidente: '',
  presidente: '',
  chaves: '',
  roles: '',
  abrev: '',
  nova: '',
  fotoFileName: '',
  imagemEmpresaFileName: '',
})

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const CompeticoesCrud = () => {
  const [competitions, setCompetitions] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null)
  const [formData, setFormData] = useState(createEmptyCompetition())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [competitionSearch, setCompetitionSearch] = useState('')

  const loadCompetitions = useCallback(async () => {
    setIsLoading(true)
    try {
      const competitionData = await listCompeticoes()
      setCompetitions(Array.isArray(competitionData) ? competitionData : [])
    } catch (error) {
      setCompetitions([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as competições.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  useEffect(() => {
    if (!selectedCompetitionId) return

    const competition = competitions.find(
      (item) => String(item.id) === String(selectedCompetitionId),
    )
    if (!competition) return

    setFormData({
      ...createEmptyCompetition(),
      ...competition,
      id: competition.id ?? '',
      finalizado: Boolean(competition.finalizado),
      ativo: competition.ativo ?? true,
      fotoFileName: '',
      imagemEmpresaFileName: '',
    })
  }, [selectedCompetitionId, competitions])

  const filteredCompetitions = useMemo(() => competitions, [competitions])
  const visibleCompetitions = useMemo(() => {
    const searchTerm = competitionSearch.trim().toLowerCase()
    if (!searchTerm) return filteredCompetitions

    return filteredCompetitions.filter(({ nomeCompeticao, descricao }) =>
      [nomeCompeticao, descricao].some((field) => {
        const normalizedField = field?.toLowerCase() ?? ''
        return normalizedField.includes(searchTerm)
      }),
    )
  }, [filteredCompetitions, competitionSearch])

  const handleCompetitionSelect = (competitionId) => {
    setSelectedCompetitionId(competitionId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleBooleanChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value === 'true',
    }))
  }

  const handleImageChange = async ({ target }, field, fileField) => {
    const file = target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setFormData((previous) => ({
        ...previous,
        [field]: dataUrl,
        [fileField]: file.name,
      }))
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível carregar a imagem selecionada.' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.nomeCompeticao) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        id: formData.id ? parseNumber(formData.id) : undefined,
        modalidadeId: parseNumber(formData.modalidadeId),
        maxInscricoes: parseNumber(formData.maxInscricoes),
        empresaId: parseNumber(formData.empresaId),
        chaves: parseNumber(formData.chaves),
        nova: parseNumber(formData.nova),
      }

      if (selectedCompetitionId) {
        await updateCompeticao(selectedCompetitionId, payload)
        setFeedback({ type: 'success', message: 'Dados da competição atualizados com sucesso.' })
      } else {
        const created = await createCompeticao(payload)
        setSelectedCompetitionId(created?.id ?? payload.id ?? null)
        setFeedback({ type: 'success', message: 'Competição cadastrada com sucesso.' })
      }

      await loadCompetitions()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar a competição.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCompetitionId) return

    setIsLoading(true)
    try {
      await deleteCompeticao(selectedCompetitionId)
      setSelectedCompetitionId(null)
      setFormData(createEmptyCompetition())
      setFeedback({ type: 'success', message: 'Competição removida do cadastro.' })
      await loadCompetitions()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a competição.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedCompetitionId(null)
    setFormData(createEmptyCompetition())
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilSettings} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Competições</h4>
              <div className="text-medium-emphasis">
                Cadastre competições e envie imagens pelo formulário para o endpoint de competições
                do painel.
              </div>
              <SelectedCompetitionBadge className="mt-2" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader>
            <strong>Competições</strong>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormInput
                type="search"
                value={competitionSearch}
                onChange={({ target }) => setCompetitionSearch(target.value)}
                placeholder="Pesquisar por competição"
                aria-label="Pesquisar competições"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center">
                <CSpinner size="sm" /> Carregando competições...
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma competição cadastrada.</div>
            ) : visibleCompetitions.length === 0 ? (
              <div className="p-3 text-medium-emphasis">
                Nenhuma competição encontrada para o termo buscado.
              </div>
            ) : (
              <CListGroup flush>
                {visibleCompetitions.map((competition) => (
                  <CListGroupItem
                    key={competition.id}
                    action
                    active={String(competition.id) === String(selectedCompetitionId)}
                    onClick={() => handleCompetitionSelect(competition.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">
                          {competition.nomeCompeticao ||
                            competition.descricao ||
                            `Competição ${competition.id}`}
                        </div>
                        <small className="text-medium-emphasis">
                          Temporada {competition.temporada || 'não informada'}
                        </small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <CBadge
                          color={competition.ativo ? 'success' : 'secondary'}
                          shape="rounded-pill"
                        >
                          {competition.ativo ? 'Ativa' : 'Inativa'}
                        </CBadge>
                        <CBadge color="info" shape="rounded-pill">
                          {competition.modalidadeId
                            ? `Modalidade ${competition.modalidadeId}`
                            : 'Sem modalidade'}
                        </CBadge>
                      </div>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={8}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{selectedCompetitionId ? 'Editar competição' : 'Nova competição'}</strong>
              <div className="small text-medium-emphasis">
                Preencha os campos obrigatórios para salvar.
              </div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={handleReset}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-id">ID</CFormLabel>
                  <CFormInput
                    id="competition-id"
                    name="id"
                    type="number"
                    value={formData.id}
                    onChange={handleInputChange}
                    readOnly={Boolean(selectedCompetitionId)}
                  />
                </CCol>
                <CCol md={8}>
                  <CFormLabel htmlFor="competition-name">Nome da competição</CFormLabel>
                  <CFormInput
                    id="competition-name"
                    name="nomeCompeticao"
                    value={formData.nomeCompeticao}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="competition-description">Descrição</CFormLabel>
                <CFormInput
                  id="competition-description"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                />
              </div>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-temporada">Temporada</CFormLabel>
                  <CFormInput
                    id="competition-temporada"
                    name="temporada"
                    value={formData.temporada}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-modalidade">Modalidade</CFormLabel>
                  <CFormInput
                    id="competition-modalidade"
                    name="modalidadeId"
                    type="number"
                    value={formData.modalidadeId}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-max">Máx. inscrições</CFormLabel>
                  <CFormInput
                    id="competition-max"
                    name="maxInscricoes"
                    type="number"
                    value={formData.maxInscricoes}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-start">Data início</CFormLabel>
                  <CFormInput
                    id="competition-start"
                    type="date"
                    name="dataInicio"
                    value={formData.dataInicio}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-end">Data fim</CFormLabel>
                  <CFormInput
                    id="competition-end"
                    type="date"
                    name="dataFim"
                    value={formData.dataFim}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-company">Empresa</CFormLabel>
                  <CFormInput
                    id="competition-company"
                    name="empresaId"
                    type="number"
                    value={formData.empresaId}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-active">Ativa</CFormLabel>
                  <CFormSelect
                    id="competition-active"
                    name="ativo"
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={handleBooleanChange}
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-finalizado">Finalizada</CFormLabel>
                  <CFormSelect
                    id="competition-finalizado"
                    name="finalizado"
                    value={formData.finalizado ? 'true' : 'false'}
                    onChange={handleBooleanChange}
                  >
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="competition-chaves">Qtd. chaves</CFormLabel>
                  <CFormInput
                    id="competition-chaves"
                    name="chaves"
                    type="number"
                    value={formData.chaves}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-coordination">Coordenação</CFormLabel>
                  <CFormInput
                    id="competition-coordination"
                    name="coordenacaoNome"
                    value={formData.coordenacaoNome}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-phone">Telefone coordenação</CFormLabel>
                  <CFormInput
                    id="competition-phone"
                    name="coordenacaoTelefone"
                    value={formData.coordenacaoTelefone}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-president">Presidente</CFormLabel>
                  <CFormInput
                    id="competition-president"
                    name="presidente"
                    value={formData.presidente}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-vice">Vice-presidente</CFormLabel>
                  <CFormInput
                    id="competition-vice"
                    name="vicePresidente"
                    value={formData.vicePresidente}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-foto">Foto da competição</CFormLabel>
                  <CFormInput
                    id="competition-foto"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, 'foto', 'fotoFileName')}
                  />
                  {formData.fotoFileName && (
                    <div className="form-text">Arquivo selecionado: {formData.fotoFileName}</div>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="competition-imagem-empresa">Imagem da empresa</CFormLabel>
                  <CFormInput
                    id="competition-imagem-empresa"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageChange(event, 'imagemEmpresa', 'imagemEmpresaFileName')
                    }
                  />
                  {formData.imagemEmpresaFileName && (
                    <div className="form-text">
                      Arquivo selecionado: {formData.imagemEmpresaFileName}
                    </div>
                  )}
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="competition-foto-url">URL da foto (opcional)</CFormLabel>
                <CFormInput
                  id="competition-foto-url"
                  name="foto"
                  value={formData.foto}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div>
                <CFormLabel htmlFor="competition-imagem-url">
                  URL da imagem da empresa (opcional)
                </CFormLabel>
                <CFormInput
                  id="competition-imagem-url"
                  name="imagemEmpresa"
                  value={formData.imagemEmpresa}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />{' '}
                  {selectedCompetitionId ? 'Atualizar' : 'Salvar'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  disabled={!selectedCompetitionId || isLoading}
                  onClick={handleDelete}
                >
                  <CIcon icon={cilTrash} className="me-2" /> Remover
                </CButton>
              </div>

              {(formData.foto || formData.imagemEmpresa) && (
                <div className="d-flex flex-column gap-2 border-top pt-3">
                  {formData.foto && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={formData.foto}
                        alt="Foto da competição"
                        width={96}
                        height={64}
                        className="rounded"
                      />
                      <div className="text-medium-emphasis">
                        Pré-visualização da foto da competição.
                      </div>
                    </div>
                  )}
                  {formData.imagemEmpresa && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={formData.imagemEmpresa}
                        alt="Imagem da empresa"
                        width={96}
                        height={64}
                        className="rounded"
                      />
                      <div className="text-medium-emphasis">
                        Pré-visualização da imagem da empresa.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CompeticoesCrud
