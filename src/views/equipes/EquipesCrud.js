import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
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
  CFormTextarea,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilGroup, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import CategorySelect from '../../components/forms/CategorySelect'
import { listCategorias } from '../../services/categoriaApi'
import { createEquipe, deleteEquipe, listEquipes, updateEquipe } from '../../services/equipeApi'

const createEmptyTeam = () => ({
  id: '',
  equipe: '',
  categoria: '',
  competicao: '',
  vitorias: '',
  derrotas: '',
  empates: '',
  golsPro: '',
  golsContra: '',
  saldoGols: '',
  partidas: '',
  pontos: '',
  classificacao: '',
  porcentagem: '',
  legenda: '',
  wo: '',
  amarelos: '',
  vermelhos: '',
  pontosAmarelo: '',
  pontosVermelho: '',
  pontuacaoCartoes: '',
  classificacaoDisciplinar: '',
  chave: '',
  pontosPerdidos: '',
  pontosGanho: '',
  representante1: '',
  representante2: '',
  email_rp1: '',
  email_rp2: '',
  fone_rp1: '',
  fone_rp2: '',
  tecnico: '',
  auxiliartecnico: '',
  rebaixamento: '',
  logoFile: null,
  logoFileName: '',
  logoPreviewUrl: '',
  fotoFile: null,
  fotoFileName: '',
  fotoPreviewUrl: '',
})

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const EquipesCrud = () => {
  const [teams, setTeams] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [formData, setFormData] = useState(createEmptyTeam())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const [categories, setCategories] = useState([])
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)

  const loadTeams = useCallback(async () => {
    if (!selectedCompetitionId) return

    setIsLoading(true)
    try {
      const teamData = await listEquipes({
        competicaoId: selectedCompetitionId,
        categoria: selectedCategoryId || undefined,
      })
      setTeams(Array.isArray(teamData) ? teamData : [])
    } catch (error) {
      setTeams([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as equipes.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId, selectedCategoryId])

  useEffect(() => {
    if (!selectedCompetitionId) return
    loadTeams()
  }, [selectedCompetitionId, selectedCategoryId, loadTeams])

  useEffect(() => {
    setSelectedCategoryId('')
    setSelectedTeamId(null)
    setTeamSearch('')
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      if (!selectedCompetitionId) {
        setCategories([])
        return
      }

      try {
        const categoryData = await listCategorias({ competicao: selectedCompetitionId })
        if (!isMounted) return
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error) {
        if (!isMounted) return
        setCategories([])
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [selectedCompetitionId])

  const formCategoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.chave ?? category.valor,
        label: category.valor ?? category.chave,
      })),
    [categories],
  )

  useEffect(() => {
    if (!selectedTeamId) return

    const team = teams.find((item) => String(item.id) === String(selectedTeamId))
    if (!team) return

    setFormData({
      ...createEmptyTeam(),
      ...team,
      competicao: String(
        team.competicao ?? team.competicaoId ?? team.id_competicao ?? selectedCompetitionId,
      ),
      categoria: team.categoria ?? formData.categoria,
      logoFile: null,
      logoFileName: '',
      logoPreviewUrl: '',
      fotoFile: null,
      fotoFileName: '',
      fotoPreviewUrl: '',
    })
  }, [selectedTeamId, teams, selectedCompetitionId])

  useEffect(() => {
    if (selectedTeamId) return

    setFormData((previous) => ({
      ...previous,
      competicao: selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
  }, [selectedCompetitionId, selectedCategoryId, selectedTeamId])

  const filteredTeams = useMemo(() => teams, [teams])
  const visibleTeams = useMemo(() => {
    const searchTerm = teamSearch.trim().toLowerCase()
    if (!searchTerm) return filteredTeams

    return filteredTeams.filter(({ equipe, representante1, representante2 }) =>
      [equipe, representante1, representante2].some((field) => {
        const normalizedField = field?.toLowerCase() ?? ''
        return normalizedField.includes(searchTerm)
      }),
    )
  }, [filteredTeams, teamSearch])

  const handleCategoryFilterChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedTeamId(null)
    setTeamSearch('')
    setFeedback(null)
  }

  const handleTeamSelect = (teamId) => {
    setSelectedTeamId(teamId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleCategoryChange = (newCategoryId) => {
    setFormData((previous) => ({ ...previous, categoria: newCategoryId }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição no menu lateral.' })
      return
    }
    if (!formData.categoria || !formData.equipe) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios.' })
      return
    }

    setIsLoading(true)
    try {
      const teamData = { ...formData }
      delete teamData.logoFile
      delete teamData.logoFileName
      delete teamData.logoPreviewUrl
      delete teamData.fotoFile
      delete teamData.fotoFileName
      delete teamData.fotoPreviewUrl
      const payload = {
        ...teamData,
        id: teamData.id ? parseNumber(teamData.id) : undefined,
        competicao: parseNumber(selectedCompetitionId),
        vitorias: parseNumber(teamData.vitorias),
        derrotas: parseNumber(teamData.derrotas),
        empates: parseNumber(teamData.empates),
        golsPro: parseNumber(teamData.golsPro),
        golsContra: parseNumber(teamData.golsContra),
        saldoGols: parseNumber(teamData.saldoGols),
        partidas: parseNumber(teamData.partidas),
        pontos: parseNumber(teamData.pontos),
        classificacao: parseNumber(teamData.classificacao),
        porcentagem: parseNumber(teamData.porcentagem),
        wo: parseNumber(teamData.wo),
        amarelos: parseNumber(teamData.amarelos),
        vermelhos: parseNumber(teamData.vermelhos),
        pontosAmarelo: parseNumber(teamData.pontosAmarelo),
        pontosVermelho: parseNumber(teamData.pontosVermelho),
        pontuacaoCartoes: parseNumber(teamData.pontuacaoCartoes),
        classificacaoDisciplinar: parseNumber(teamData.classificacaoDisciplinar),
        pontosPerdidos: parseNumber(teamData.pontosPerdidos),
        pontosGanho: parseNumber(teamData.pontosGanho),
      }

      if (selectedTeamId) {
        await updateEquipe(selectedTeamId, payload, formData.logoFile, formData.fotoFile)
        setFeedback({ type: 'success', message: 'Dados da equipe atualizados com sucesso.' })
      } else {
        const created = await createEquipe(payload, formData.logoFile, formData.fotoFile)
        setSelectedTeamId(created?.id ?? payload.id ?? null)
        setFeedback({ type: 'success', message: 'Equipe cadastrada com sucesso.' })
      }

      await loadTeams()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar a equipe.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTeamId) return

    setIsLoading(true)
    try {
      await deleteEquipe(selectedTeamId)
      setSelectedTeamId(null)
      setFormData((previous) => ({
        ...createEmptyTeam(),
        competicao: selectedCompetitionId,
        categoria: previous.categoria,
      }))
      setFeedback({ type: 'success', message: 'Equipe removida do cadastro.' })
      await loadTeams()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a equipe.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedTeamId(null)
    setFormData((previous) => ({
      ...createEmptyTeam(),
      competicao: selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
    setFeedback(null)
  }

  const handleLogoFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      logoPreviewUrl: objectUrl,
      logoFile: file,
      logoFileName: file.name,
    }))
  }

  const handleFotoFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      fotoPreviewUrl: objectUrl,
      fotoFile: file,
      fotoFileName: file.name,
    }))
  }

  const getCategoryName = (team) =>
    formCategoryOptions.find((category) => String(category.value) === String(team.categoria))?.label ??
    team.categoria ??
    'Categoria não informada'

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilGroup} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Equipes</h4>
              <div className="text-medium-emphasis">
                Gerencie os dados de equipes usando os endpoints de equipes, competições e categorias da API.
              </div>
              <SelectedCompetitionBadge className="mt-2" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex flex-column gap-2">
            <div>
              <strong>Equipes</strong>
              <div className="small text-medium-emphasis">Filtradas pela competição selecionada e categoria</div>
            </div>
            <div className="d-flex gap-2">
              <CategorySelect
                label={null}
                placeholder="Categoria"
                competitionId={selectedCompetitionId}
                value={selectedCategoryId}
                onValueChange={handleCategoryFilterChange}
                size="sm"
                ariaLabel="Selecionar categoria para filtrar"
                onError={(message) => setFeedback({ type: 'danger', message })}
              />
            </div>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormInput
                type="search"
                value={teamSearch}
                onChange={({ target }) => setTeamSearch(target.value)}
                placeholder="Pesquisar por equipe ou representante"
                aria-label="Pesquisar equipes"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center">
                <CSpinner size="sm" /> Carregando equipes...
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma equipe cadastrada para esta competição.</div>
            ) : visibleTeams.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma equipe encontrada para o termo buscado.</div>
            ) : (
              <CListGroup flush>
                {visibleTeams.map((team) => (
                  <CListGroupItem
                    key={team.id}
                    action
                    active={String(team.id) === String(selectedTeamId)}
                    onClick={() => handleTeamSelect(team.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{team.equipe}</div>
                        <small className="text-medium-emphasis">
                          Representante: {team.representante1 || 'não informado'}
                        </small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <CBadge color="secondary" shape="rounded-pill">
                          {getCategoryName(team)}
                        </CBadge>
                        <CBadge color="info" shape="rounded-pill">
                          {team.pontos ? `${team.pontos} pts` : 'Pontuação não informada'}
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
              <strong>{selectedTeamId ? 'Editar equipe' : 'Nova equipe'}</strong>
              <div className="small text-medium-emphasis">Preencha todos os campos obrigatórios para salvar.</div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={handleReset}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-4">
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-name">Equipe</CFormLabel>
                  <CFormInput
                    id="team-name"
                    name="equipe"
                    placeholder="Nome da equipe"
                    value={formData.equipe}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-id">ID</CFormLabel>
                  <CFormInput
                    id="team-id"
                    name="id"
                    type="number"
                    placeholder="Código"
                    value={formData.id}
                    onChange={handleInputChange}
                    readOnly={Boolean(selectedTeamId)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-chave">Chave</CFormLabel>
                  <CFormInput
                    id="team-chave"
                    name="chave"
                    placeholder="Ex.: A"
                    value={formData.chave}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CategorySelect
                    id="team-category"
                    name="categoria"
                    competitionId={selectedCompetitionId}
                    value={formData.categoria}
                    onValueChange={handleCategoryChange}
                    onError={(message) => setFeedback({ type: 'danger', message })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-rebaixamento">Rebaixamento</CFormLabel>
                  <CFormSelect
                    id="team-rebaixamento"
                    name="rebaixamento"
                    value={formData.rebaixamento}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="team-legenda">Legenda</CFormLabel>
                <CFormTextarea
                  id="team-legenda"
                  name="legenda"
                  rows={3}
                  placeholder="Observações gerais sobre a equipe"
                  value={formData.legenda}
                  onChange={handleInputChange}
                />
              </div>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-logo-upload">Upload do logo</CFormLabel>
                  <CFormInput
                    id="team-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                  />
                  {formData.logoFileName && (
                    <div className="form-text">Arquivo selecionado: {formData.logoFileName}</div>
                  )}
                  {formData.logoPreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.logoPreviewUrl}
                        alt="Prévia do logo da equipe"
                        className="img-fluid rounded border"
                      />
                    </div>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-foto-upload">Upload da foto da equipe</CFormLabel>
                  <CFormInput
                    id="team-foto-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoFileChange}
                  />
                  {formData.fotoFileName && (
                    <div className="form-text">Arquivo selecionado: {formData.fotoFileName}</div>
                  )}
                  {formData.fotoPreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.fotoPreviewUrl}
                        alt="Prévia da foto da equipe"
                        className="img-fluid rounded border"
                      />
                    </div>
                  )}
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="team-v">Vitórias</CFormLabel>
                  <CFormInput id="team-v" name="vitorias" type="number" value={formData.vitorias} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-e">Empates</CFormLabel>
                  <CFormInput id="team-e" name="empates" type="number" value={formData.empates} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-d">Derrotas</CFormLabel>
                  <CFormInput id="team-d" name="derrotas" type="number" value={formData.derrotas} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-part">Partidas</CFormLabel>
                  <CFormInput id="team-part" name="partidas" type="number" value={formData.partidas} onChange={handleInputChange} />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="team-gp">Gols pró</CFormLabel>
                  <CFormInput id="team-gp" name="golsPro" type="number" value={formData.golsPro} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-gc">Gols contra</CFormLabel>
                  <CFormInput id="team-gc" name="golsContra" type="number" value={formData.golsContra} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-sg">Saldo de gols</CFormLabel>
                  <CFormInput id="team-sg" name="saldoGols" type="number" value={formData.saldoGols} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-pts">Pontos</CFormLabel>
                  <CFormInput id="team-pts" name="pontos" type="number" value={formData.pontos} onChange={handleInputChange} />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="team-class">Classificação</CFormLabel>
                  <CFormInput
                    id="team-class"
                    name="classificacao"
                    type="number"
                    value={formData.classificacao}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-porcentagem">Porcentagem</CFormLabel>
                  <CFormInput
                    id="team-porcentagem"
                    name="porcentagem"
                    type="number"
                    value={formData.porcentagem}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-pp">Pontos perdidos</CFormLabel>
                  <CFormInput id="team-pp" name="pontosPerdidos" type="number" value={formData.pontosPerdidos} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-pg">Pontos ganhos</CFormLabel>
                  <CFormInput id="team-pg" name="pontosGanho" type="number" value={formData.pontosGanho} onChange={handleInputChange} />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="team-wo">WO</CFormLabel>
                  <CFormInput id="team-wo" name="wo" type="number" value={formData.wo} onChange={handleInputChange} />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-pt-amarelo">Pts Amarelo</CFormLabel>
                  <CFormInput
                    id="team-pt-amarelo"
                    name="pontosAmarelo"
                    type="number"
                    value={formData.pontosAmarelo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-pt-vermelho">Pts Vermelho</CFormLabel>
                  <CFormInput
                    id="team-pt-vermelho"
                    name="pontosVermelho"
                    type="number"
                    value={formData.pontosVermelho}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="team-qtd-amarelo">Qtd. Amarelo</CFormLabel>
                  <CFormInput
                    id="team-qtd-amarelo"
                    name="amarelos"
                    type="number"
                    value={formData.amarelos}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-qtd-vermelho">Qtd. Vermelho</CFormLabel>
                  <CFormInput
                    id="team-qtd-vermelho"
                    name="vermelhos"
                    type="number"
                    value={formData.vermelhos}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-pontos-cartoes">Pontuação Cartões</CFormLabel>
                  <CFormInput
                    id="team-pontos-cartoes"
                    name="pontuacaoCartoes"
                    type="number"
                    value={formData.pontuacaoCartoes}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-classificacao">Classificação disciplinar</CFormLabel>
                  <CFormInput
                    id="team-classificacao"
                    name="classificacaoDisciplinar"
                    type="number"
                    value={formData.classificacaoDisciplinar}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-rep1">Representante 1</CFormLabel>
                  <CFormInput
                    id="team-rep1"
                    name="representante1"
                    value={formData.representante1}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-rep2">Representante 2</CFormLabel>
                  <CFormInput
                    id="team-rep2"
                    name="representante2"
                    value={formData.representante2}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-email1">E-mail representante 1</CFormLabel>
                  <CFormInput
                    id="team-email1"
                    name="email_rp1"
                    type="email"
                    value={formData.email_rp1}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-email2">E-mail representante 2</CFormLabel>
                  <CFormInput
                    id="team-email2"
                    name="email_rp2"
                    type="email"
                    value={formData.email_rp2}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-phone1">Telefone representante 1</CFormLabel>
                  <CFormInput
                    id="team-phone1"
                    name="fone_rp1"
                    value={formData.fone_rp1}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-phone2">Telefone representante 2</CFormLabel>
                  <CFormInput
                    id="team-phone2"
                    name="fone_rp2"
                    value={formData.fone_rp2}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="team-coach">Técnico</CFormLabel>
                  <CFormInput
                    id="team-coach"
                    name="tecnico"
                    value={formData.tecnico}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="team-assistant">Auxiliar técnico</CFormLabel>
                  <CFormInput
                    id="team-assistant"
                    name="auxiliartecnico"
                    value={formData.auxiliartecnico}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" /> Salvar
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset} disabled={isLoading}>
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  disabled={!selectedTeamId || isLoading}
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

export default EquipesCrud
