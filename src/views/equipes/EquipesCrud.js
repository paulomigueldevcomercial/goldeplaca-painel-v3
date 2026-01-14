import React, { useEffect, useMemo, useState } from 'react'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilGroup, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import { fetchTeamSetup } from '../../services/teamApi'

const createEmptyTeam = (competitionId = '', categoryId = '') => ({
  equipe: '',
  categoria: categoryId,
  id: '',
  V: '',
  D: '',
  E: '',
  GP: '',
  GC: '',
  SG: '',
  part: '',
  PTS: '',
  class: '',
  porcentagem: '',
  legenda: '',
  wo: '',
  qtdAmarelo: '',
  qtdVermelho: '',
  ptAmarelo: '',
  ptVermelho: '',
  pontuacaoCartoes: '',
  classificacao_disciplinar: '',
  id_competicao: competitionId,
  chave: '',
  pp: '',
  pg: '',
  representante1: '',
  representante2: '',
  email_rp1: '',
  email_rp2: '',
  fone_rp1: '',
  fone_rp2: '',
  tecnico: '',
  auxiliartecnico: '',
  rebaixamento: '',
})

const EquipesCrud = () => {
  const [competitions, setCompetitions] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [formData, setFormData] = useState(createEmptyTeam())
  const [feedback, setFeedback] = useState(null)
  const [teamSearch, setTeamSearch] = useState('')

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === selectedCompetitionId) ?? null,
    [competitions, selectedCompetitionId],
  )

  const categories = selectedCompetition?.categories ?? []

  useEffect(() => {
    fetchTeamSetup().then(({ competitions: competitionData, teams: teamsData }) => {
      setCompetitions(competitionData)
      setTeams(teamsData)

      if (!competitionData.length) return

      setSelectedCompetitionId((previous) => previous ?? competitionData[0].id)
      setFormData((previous) => {
        const baseCompetitionId = previous.id_competicao || competitionData[0].id
        const competition = competitionData.find((item) => item.id === baseCompetitionId) ?? competitionData[0]
        const defaultCategoryId = competition.categories[0]?.id ?? ''

        return {
          ...createEmptyTeam(baseCompetitionId, defaultCategoryId),
          equipe: previous.equipe,
          id: previous.id,
          categoria: previous.categoria || defaultCategoryId,
          representante1: previous.representante1,
          representante2: previous.representante2,
          email_rp1: previous.email_rp1,
          email_rp2: previous.email_rp2,
          fone_rp1: previous.fone_rp1,
          fone_rp2: previous.fone_rp2,
          tecnico: previous.tecnico,
          auxiliartecnico: previous.auxiliartecnico,
          legenda: previous.legenda,
          rebaixamento: previous.rebaixamento,
        }
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return

    const team = teams.find((item) => item.id === selectedTeamId)
    if (!team) return

    setFormData({ ...createEmptyTeam(), ...team, id: team.id })
  }, [selectedTeamId, teams])

  useEffect(() => {
    if (selectedTeamId) return
    if (!selectedCompetition) return

    const defaultCategoryId = selectedCompetition.categories[0]?.id ?? ''

    setFormData((previous) => ({
      ...createEmptyTeam(selectedCompetition.id, defaultCategoryId),
      equipe: previous.equipe,
      id: previous.id,
      categoria: previous.categoria || defaultCategoryId,
      representante1: previous.representante1,
      representante2: previous.representante2,
      email_rp1: previous.email_rp1,
      email_rp2: previous.email_rp2,
      fone_rp1: previous.fone_rp1,
      fone_rp2: previous.fone_rp2,
      tecnico: previous.tecnico,
      auxiliartecnico: previous.auxiliartecnico,
      legenda: previous.legenda,
      rebaixamento: previous.rebaixamento,
    }))
  }, [selectedCompetition, selectedTeamId])

  const filteredTeams = useMemo(
    () => teams.filter((team) => team.id_competicao === selectedCompetitionId),
    [teams, selectedCompetitionId],
  )
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

  const handleCompetitionFilterChange = ({ target }) => {
    setSelectedCompetitionId(target.value)
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

  const handleCompetitionChange = ({ target }) => {
    const newCompetitionId = target.value
    const competition = competitions.find((item) => item.id === newCompetitionId)
    const newCategoryId = competition?.categories[0]?.id ?? ''

    setFormData((previous) => ({
      ...previous,
      id_competicao: newCompetitionId,
      categoria: newCategoryId,
    }))
  }

  const handleCategoryChange = ({ target }) => {
    setFormData((previous) => ({ ...previous, categoria: target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.id_competicao || !formData.categoria || !formData.id) return

    const teamId = selectedTeamId ?? Number(formData.id)
    const payload = {
      ...formData,
      id: teamId,
    }

    setTeams((previous) => {
      const exists = previous.some((item) => item.id === teamId)
      return exists ? previous.map((team) => (team.id === teamId ? payload : team)) : [...previous, payload]
    })

    setSelectedTeamId(teamId)
    setFeedback(selectedTeamId ? 'Dados da equipe atualizados com sucesso.' : 'Equipe cadastrada com sucesso.')
  }

  const handleDelete = () => {
    if (!selectedTeamId) return

    setTeams((previous) => previous.filter((team) => team.id !== selectedTeamId))
    setSelectedTeamId(null)
    setFormData(createEmptyTeam(selectedCompetitionId ?? ''))
    setFeedback('Equipe removida do cadastro.')
  }

  const handleReset = () => {
    const categoryId = selectedCompetition?.categories[0]?.id ?? ''

    setSelectedTeamId(null)
    setFormData(createEmptyTeam(selectedCompetitionId ?? '', categoryId))
    setFeedback(null)
  }

  const getCategoryName = (team) => {
    const competition = competitions.find((item) => item.id === team.id_competicao)
    return competition?.categories.find((category) => category.id === team.categoria)?.name ?? 'Categoria não informada'
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilGroup} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Equipes</h4>
              <div className="text-medium-emphasis">
                Gerencie os dados de equipes por competição. Os registros são mantidos em memória para simular o fluxo do CRUD.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Equipes</strong>
              <div className="small text-medium-emphasis">Filtradas por competição</div>
            </div>
            <CFormSelect
              size="sm"
              value={selectedCompetitionId ?? ''}
              onChange={handleCompetitionFilterChange}
              aria-label="Selecionar competição para filtrar"
              className="w-auto"
            >
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </CFormSelect>
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
            {filteredTeams.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma equipe cadastrada para esta competição.</div>
            ) : visibleTeams.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma equipe encontrada para o termo buscado.</div>
            ) : (
              <CListGroup flush>
                {visibleTeams.map((team) => (
                  <CListGroupItem
                    key={team.id}
                    action
                    active={team.id === selectedTeamId}
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
                          {team.PTS ? `${team.PTS} pts` : 'Pontuação não informada'}
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
          <CAlert color="success" className="mb-3">
            {feedback}
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
                    required
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
                <CCol md={4}>
                  <CFormLabel htmlFor="team-competition">Competição</CFormLabel>
                  <CFormSelect
                    id="team-competition"
                    name="id_competicao"
                    value={formData.id_competicao}
                    onChange={handleCompetitionChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {competitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {competition.name} ({competition.season})
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-category">Categoria</CFormLabel>
                  <CFormSelect
                    id="team-category"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
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
                <CCol md={3}>
                  <CFormLabel htmlFor="team-v">Vitórias (V)</CFormLabel>
                  <CFormInput id="team-v" name="V" type="number" value={formData.V} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-e">Empates (E)</CFormLabel>
                  <CFormInput id="team-e" name="E" type="number" value={formData.E} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-d">Derrotas (D)</CFormLabel>
                  <CFormInput id="team-d" name="D" type="number" value={formData.D} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-part">Partidas</CFormLabel>
                  <CFormInput id="team-part" name="part" type="number" value={formData.part} onChange={handleInputChange} />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="team-gp">GP</CFormLabel>
                  <CFormInput id="team-gp" name="GP" type="number" value={formData.GP} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-gc">GC</CFormLabel>
                  <CFormInput id="team-gc" name="GC" type="number" value={formData.GC} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-sg">SG</CFormLabel>
                  <CFormInput id="team-sg" name="SG" type="number" value={formData.SG} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-pts">PTS</CFormLabel>
                  <CFormInput id="team-pts" name="PTS" type="number" value={formData.PTS} onChange={handleInputChange} />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="team-class">Classificação</CFormLabel>
                  <CFormInput
                    id="team-class"
                    name="class"
                    type="number"
                    value={formData.class}
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
                  <CFormLabel htmlFor="team-pp">PP</CFormLabel>
                  <CFormInput id="team-pp" name="pp" type="number" value={formData.pp} onChange={handleInputChange} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="team-pg">PG</CFormLabel>
                  <CFormInput id="team-pg" name="pg" type="number" value={formData.pg} onChange={handleInputChange} />
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
                    name="ptAmarelo"
                    type="number"
                    value={formData.ptAmarelo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-pt-vermelho">Pts Vermelho</CFormLabel>
                  <CFormInput
                    id="team-pt-vermelho"
                    name="ptVermelho"
                    type="number"
                    value={formData.ptVermelho}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="team-qtd-amarelo">Qtd. Amarelo</CFormLabel>
                  <CFormInput
                    id="team-qtd-amarelo"
                    name="qtdAmarelo"
                    type="number"
                    value={formData.qtdAmarelo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="team-qtd-vermelho">Qtd. Vermelho</CFormLabel>
                  <CFormInput
                    id="team-qtd-vermelho"
                    name="qtdVermelho"
                    type="number"
                    value={formData.qtdVermelho}
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
                    name="classificacao_disciplinar"
                    type="number"
                    value={formData.classificacao_disciplinar}
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
                <CButton color="primary" type="submit">
                  <CIcon icon={cilSave} className="me-2" /> Salvar
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset}>
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  disabled={!selectedTeamId}
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
