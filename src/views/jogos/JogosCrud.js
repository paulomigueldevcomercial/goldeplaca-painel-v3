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
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilSoccer, cilTrash } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import CategorySelect from '../../components/forms/CategorySelect'
import { listEquipes } from '../../services/equipeApi'
import { createJogo, deleteJogo, listJogos, updateJogo } from '../../services/jogosApi'

const createEmptyGame = () => ({
  codigo: '',
  categoria: '',
  rodada: '',
  dataJogo: '',
  dia: '',
  hora: '',
  placar1: '',
  placar2: '',
  equipe1: '',
  equipe1Id: '',
  equipe2: '',
  equipe2Id: '',
  campo: '',
  fase: '',
  njg: '',
  wo: '',
  wo2: '',
  sema: '',
  competicaoId: '',
  confirmacaoRodada: '',
  tempojg: '',
  destaque: '',
  penaltiEquipe1: '',
  penaltiEquipe2: '',
  chave: '',
})

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatGameDate = (value) => {
  if (!value) return 'Data não informada'

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return dateFormatter.format(date)
}

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const findTeamByIdOrName = (teams, id, name) => {
  const idMatch = teams.find((team) => String(team.id) === String(id))
  if (idMatch) return idMatch

  const normalizedName = normalizeText(name)
  if (!normalizedName) return null

  return teams.find((team) => normalizeText(team.equipe) === normalizedName) ?? null
}

const JogosCrud = () => {
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedGameId, setSelectedGameId] = useState(null)
  const [formData, setFormData] = useState(createEmptyGame())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [gameSearch, setGameSearch] = useState('')
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)

  const loadGames = useCallback(async () => {
    if (!selectedCompetitionId) return

    setIsLoading(true)
    try {
      const gameData = await listJogos({
        competicaoId: selectedCompetitionId,
        categoria: selectedCategoryId || undefined,
      })
      setGames(Array.isArray(gameData) ? gameData : [])
    } catch (error) {
      setGames([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os jogos.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId, selectedCategoryId])

  const loadTeams = useCallback(async () => {
    if (!selectedCompetitionId || !formData.categoria) {
      setTeams([])
      return
    }

    try {
      const teamData = await listEquipes({
        competicaoId: selectedCompetitionId,
        categoria: formData.categoria,
      })
      setTeams(Array.isArray(teamData) ? teamData : [])
    } catch (error) {
      setTeams([])
    }
  }, [formData.categoria, selectedCompetitionId])

  useEffect(() => {
    if (!selectedCompetitionId) return
    loadGames()
  }, [selectedCompetitionId, selectedCategoryId, loadGames])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  useEffect(() => {
    setSelectedCategoryId('')
    setSelectedGameId(null)
    setGameSearch('')
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedGameId) return

    const game = games.find((item) => String(item.codigo) === String(selectedGameId))
    if (!game) return
    const team1 = findTeamByIdOrName(teams, game.equipe1Id, game.equipe1)
    const team2 = findTeamByIdOrName(teams, game.equipe2Id, game.equipe2)

    setFormData({
      ...createEmptyGame(),
      ...game,
      competicaoId: String(game.competicaoId ?? selectedCompetitionId),
      categoria: game.categoria ?? selectedCategoryId,
      equipe1Id: String(team1?.id ?? game.equipe1Id ?? ''),
      equipe1: team1?.equipe ?? game.equipe1 ?? '',
      equipe2Id: String(team2?.id ?? game.equipe2Id ?? ''),
      equipe2: team2?.equipe ?? game.equipe2 ?? '',
    })
  }, [selectedGameId, games, teams, selectedCompetitionId, selectedCategoryId])

  useEffect(() => {
    if (selectedGameId) return

    setFormData((previous) => ({
      ...previous,
      competicaoId: selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
  }, [selectedCompetitionId, selectedCategoryId, selectedGameId])

  const filteredGames = useMemo(() => games, [games])
  const visibleGames = useMemo(() => {
    const searchTerm = gameSearch.trim().toLowerCase()
    if (!searchTerm) return filteredGames

    return filteredGames.filter(({ equipe1, equipe2, codigo }) =>
      [equipe1, equipe2, codigo?.toString()].some((field) => {
        const normalizedField = field?.toString().toLowerCase() ?? ''
        return normalizedField.includes(searchTerm)
      }),
    )
  }, [filteredGames, gameSearch])

  const handleCategoryFilterChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedGameId(null)
    setGameSearch('')
    setFeedback(null)
  }

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId)
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
    setFormData((previous) => ({
      ...previous,
      categoria: newCategoryId,
    }))
  }

  const handleTeamSelection =
    (targetFieldId, targetFieldName) =>
    ({ target }) => {
      const selectedTeam = teams.find((team) => String(team.id) === String(target.value))
      setFormData((previous) => ({
        ...previous,
        [targetFieldId]: target.value,
        [targetFieldName]: selectedTeam?.equipe ?? '',
      }))
    }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição no menu lateral.' })
      return
    }
    if (!formData.categoria || !formData.codigo) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        codigo: parseNumber(formData.codigo),
        rodada: parseNumber(formData.rodada),
        equipe1Id: parseNumber(formData.equipe1Id),
        equipe2Id: parseNumber(formData.equipe2Id),
        njg: parseNumber(formData.njg),
        competicaoId: parseNumber(selectedCompetitionId),
        penaltiEquipe1: parseNumber(formData.penaltiEquipe1),
        penaltiEquipe2: parseNumber(formData.penaltiEquipe2),
      }

      if (selectedGameId) {
        await updateJogo(selectedGameId, payload)
        setFeedback({ type: 'success', message: 'Dados do jogo atualizados com sucesso.' })
      } else {
        await createJogo(payload)
        setSelectedGameId(payload.codigo)
        setFeedback({ type: 'success', message: 'Jogo cadastrado com sucesso.' })
      }

      await loadGames()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o jogo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedGameId) return

    setIsLoading(true)
    try {
      await deleteJogo(selectedGameId)
      setSelectedGameId(null)
      setFormData((previous) => ({
        ...createEmptyGame(),
        competicaoId: selectedCompetitionId,
        categoria: previous.categoria,
      }))
      setFeedback({ type: 'success', message: 'Jogo removido do cadastro.' })
      await loadGames()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o jogo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedGameId(null)
    setFormData((previous) => ({
      ...createEmptyGame(),
      competicaoId: selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilSoccer} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Jogos</h4>
              <div className="text-medium-emphasis">
                Cadastre partidas utilizando os endpoints de jogos e selecione as equipes vinculadas
                à competição.
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
              <strong>Jogos</strong>
              <div className="small text-medium-emphasis">
                Filtrados pela competição selecionada e categoria
              </div>
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
                value={gameSearch}
                onChange={({ target }) => setGameSearch(target.value)}
                placeholder="Pesquisar por código ou equipe"
                aria-label="Pesquisar jogos"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center">
                <CSpinner size="sm" /> Carregando jogos...
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="p-3 text-medium-emphasis">
                Nenhum jogo cadastrado para esta competição.
              </div>
            ) : visibleGames.length === 0 ? (
              <div className="p-3 text-medium-emphasis">
                Nenhum jogo encontrado para o termo buscado.
              </div>
            ) : (
              <CListGroup flush>
                {visibleGames.map((game) => (
                  <CListGroupItem
                    key={game.codigo}
                    action
                    active={String(game.codigo) === String(selectedGameId)}
                    onClick={() => handleGameSelect(game.codigo)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">
                          {game.equipe1 || 'Equipe 1'} x {game.equipe2 || 'Equipe 2'}
                        </div>
                        <small className="text-medium-emphasis">Código {game.codigo}</small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <CBadge color="secondary" shape="rounded-pill">
                          {game.categoria || 'Categoria'}
                        </CBadge>
                        <CBadge color="info" shape="rounded-pill">
                          {formatGameDate(game.dataJogo)}
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
              <strong>{selectedGameId ? 'Editar jogo' : 'Novo jogo'}</strong>
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
                  <CFormLabel htmlFor="game-code">Código</CFormLabel>
                  <CFormInput
                    id="game-code"
                    name="codigo"
                    type="number"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    required
                    readOnly={Boolean(selectedGameId)}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="game-round">Rodada</CFormLabel>
                  <CFormInput
                    id="game-round"
                    name="rodada"
                    type="number"
                    value={formData.rodada}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="game-date">Data</CFormLabel>
                  <CFormInput
                    id="game-date"
                    type="date"
                    name="dataJogo"
                    value={formData.dataJogo}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CategorySelect
                    id="game-category"
                    name="categoria"
                    competitionId={selectedCompetitionId}
                    value={formData.categoria}
                    onValueChange={handleCategoryChange}
                    onError={(message) => setFeedback({ type: 'danger', message })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="game-time">Horário</CFormLabel>
                  <CFormInput
                    id="game-time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="game-team1">Equipe 1</CFormLabel>
                  <CFormSelect
                    id="game-team1"
                    name="equipe1Id"
                    value={formData.equipe1Id}
                    onChange={handleTeamSelection('equipe1Id', 'equipe1')}
                    required
                  >
                    <option value="">Selecione</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.equipe}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="game-team2">Equipe 2</CFormLabel>
                  <CFormSelect
                    id="game-team2"
                    name="equipe2Id"
                    value={formData.equipe2Id}
                    onChange={handleTeamSelection('equipe2Id', 'equipe2')}
                    required
                  >
                    <option value="">Selecione</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.equipe}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel htmlFor="game-score1">Placar 1</CFormLabel>
                  <CFormInput
                    id="game-score1"
                    name="placar1"
                    value={formData.placar1}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="game-score2">Placar 2</CFormLabel>
                  <CFormInput
                    id="game-score2"
                    name="placar2"
                    value={formData.placar2}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="game-penalty1">Pênaltis Eq. 1</CFormLabel>
                  <CFormInput
                    id="game-penalty1"
                    name="penaltiEquipe1"
                    type="number"
                    value={formData.penaltiEquipe1}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="game-penalty2">Pênaltis Eq. 2</CFormLabel>
                  <CFormInput
                    id="game-penalty2"
                    name="penaltiEquipe2"
                    type="number"
                    value={formData.penaltiEquipe2}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="game-field">Campo</CFormLabel>
                  <CFormInput
                    id="game-field"
                    name="campo"
                    value={formData.campo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="game-stage">Fase</CFormLabel>
                  <CFormInput
                    id="game-stage"
                    name="fase"
                    value={formData.fase}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="game-highlight">Destaque</CFormLabel>
                  <CFormSelect
                    id="game-highlight"
                    name="destaque"
                    value={formData.destaque}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" /> Salvar
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
                  disabled={!selectedGameId || isLoading}
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

export default JogosCrud
