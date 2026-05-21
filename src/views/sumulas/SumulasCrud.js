import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilReload, cilSave, cilSearch, cilTrash } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import {
  createSumulas,
  deleteSumula,
  getSumulaFormulario,
  listSumulas,
  updateSumula,
} from '../../services/sumulasApi'

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const toInputNumber = (value) => {
  const parsed = parseNumber(value)
  return parsed ?? 0
}

const toBooleanFlag = (value) => {
  if (value === true || value === false) return value

  const parsed = parseNumber(value)
  if (parsed !== null) return parsed > 0

  return Boolean(value)
}

const getTeamName = (team) => team?.nome || team?.equipe?.equipe || 'Equipe'

const getTeamId = (team) => team?.idEquipe ?? team?.equipe?.id ?? null

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const getPlayerName = (player) => player?.nomeJogador || player?.nome || 'Jogador'

const getPlayerId = (player) => player?.id ?? player?.idJogador ?? null

const getPlayerKey = (teamIndex, playerIndex, player) =>
  `${teamIndex}-${getPlayerId(player) ?? playerIndex}`

const createPlayerFormState = (player) => ({
  selected: true,
  cartaoAmarelo: player?.cartaoAmarelo ?? '',
  cartaoVermelho: player?.cartaoVermelho ?? '',
  gols: player?.gols ?? '',
  capitao: toBooleanFlag(player?.capitao),
})

const getSavedPlayerKey = (sumula) => {
  const idJogador = sumula?.idJogador ?? sumula?.jogadorId
  if (idJogador) return `id:${idJogador}`

  return `name:${normalizeText(sumula?.time)}:${normalizeText(sumula?.nomeJogador)}`
}

const buildSavedSumulasMap = (sumulas = []) =>
  sumulas.reduce((acc, sumula) => {
    acc[getSavedPlayerKey(sumula)] = sumula
    return acc
  }, {})

const findSavedSumula = (savedSumulasMap, team, player) => {
  const playerId = getPlayerId(player)
  if (playerId) {
    const byId = savedSumulasMap[`id:${playerId}`]
    if (byId) return byId
  }

  return savedSumulasMap[
    `name:${normalizeText(getTeamName(team))}:${normalizeText(getPlayerName(player))}`
  ]
}

const createPlayerFormStateFromSaved = (player, savedSumula, hasSavedSumulas) => {
  if (!hasSavedSumulas || !savedSumula) {
    return {
      ...createPlayerFormState(player),
      selected: !hasSavedSumulas,
    }
  }

  return {
    selected: true,
    cartaoAmarelo: savedSumula?.cartaoAmarelo ?? '',
    cartaoVermelho: savedSumula?.cartaoVermelho ?? '',
    gols: savedSumula?.gols ?? '',
    capitao: toBooleanFlag(savedSumula?.capitao),
  }
}

const buildPlayerStates = (teams = [], savedSumulas = []) => {
  const savedSumulasMap = buildSavedSumulasMap(savedSumulas)
  const hasSavedSumulas = savedSumulas.length > 0

  return teams.reduce((acc, team, teamIndex) => {
    const players = Array.isArray(team?.jogadores) ? team.jogadores : []
    players.forEach((player, playerIndex) => {
      const savedSumula = findSavedSumula(savedSumulasMap, team, player)
      acc[getPlayerKey(teamIndex, playerIndex, player)] = createPlayerFormStateFromSaved(
        player,
        savedSumula,
        hasSavedSumulas,
      )
    })
    return acc
  }, {})
}

const buildDefaultPlayerStates = (teams = []) =>
  teams.reduce((acc, team, teamIndex) => {
    const players = Array.isArray(team?.jogadores) ? team.jogadores : []
    players.forEach((player, playerIndex) => {
      acc[getPlayerKey(teamIndex, playerIndex, player)] = createPlayerFormState(player)
    })
    return acc
  }, {})

const getGameCompetition = (formData) =>
  formData?.jogo?.competicaoId ?? formData?.jogo?.competicao ?? null

const getGameCategory = (formData, team, player) =>
  formData?.jogo?.categoria ?? team?.equipe?.categoria ?? player?.categoria ?? ''

const getSummaryNumber = (value) => parseNumber(value) ?? 0

const buildTeamSummary = (team, teamIndex, playerStates) => {
  const players = Array.isArray(team?.jogadores) ? team.jogadores : []

  return players.reduce(
    (summary, player, playerIndex) => {
      const key = getPlayerKey(teamIndex, playerIndex, player)
      const state = playerStates[key] ?? createPlayerFormState(player)

      if (!state.selected) return summary

      return {
        participantes: summary.participantes + 1,
        gols: summary.gols + getSummaryNumber(state.gols),
        amarelos: summary.amarelos + getSummaryNumber(state.cartaoAmarelo),
        vermelhos: summary.vermelhos + getSummaryNumber(state.cartaoVermelho),
      }
    },
    {
      participantes: 0,
      gols: 0,
      amarelos: 0,
      vermelhos: 0,
    },
  )
}

const SumulasCrud = () => {
  const [gameId, setGameId] = useState('')
  const [loadedGameId, setLoadedGameId] = useState('')
  const [formData, setFormData] = useState(null)
  const [playerStates, setPlayerStates] = useState({})
  const [mesario, setMesario] = useState('')
  const [idArbitro, setIdArbitro] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const teams = useMemo(() => {
    if (!Array.isArray(formData?.equipes)) return []
    return formData.equipes.slice(0, 2)
  }, [formData])

  const teamSummaries = useMemo(
    () => teams.map((team, teamIndex) => buildTeamSummary(team, teamIndex, playerStates)),
    [teams, playerStates],
  )

  const handleSearch = async (event) => {
    event.preventDefault()
    setFeedback(null)

    const id = parseNumber(gameId)
    if (!id) {
      setFeedback({ type: 'danger', message: 'Informe um ID de jogo válido.' })
      return
    }

    setIsLoading(true)
    try {
      const data = await getSumulaFormulario(id)
      const savedSumulasResponse = await listSumulas({ jogoId: id })
      const savedSumulas = Array.isArray(savedSumulasResponse) ? savedSumulasResponse : []
      const firstSavedSumula = savedSumulas[0]
      const responseTeams = Array.isArray(data?.equipes) ? data.equipes : []
      const hasSavedSumula = savedSumulas.length > 0
      setFormData(data)
      setPlayerStates(buildPlayerStates(responseTeams, savedSumulas))
      setIsUpdateMode(hasSavedSumula)
      setMesario(firstSavedSumula?.mesario ?? data?.mesario ?? '')
      setIdArbitro(
        firstSavedSumula?.arbitro !== undefined && firstSavedSumula?.arbitro !== null
          ? String(firstSavedSumula.arbitro)
          : (data?.idArbitro ?? ''),
      )
      setLoadedGameId(String(id))
      setFeedback(null)
    } catch (error) {
      setFormData(null)
      setPlayerStates({})
      setIsUpdateMode(false)
      setLoadedGameId('')
      setFeedback({ type: 'danger', message: 'Não foi possível buscar os dados da súmula.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerChange = (key, field, value) => {
    setPlayerStates((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        [field]: value,
      },
    }))
  }

  const buildCreatePayload = () => {
    const id = parseNumber(loadedGameId || gameId)
    const arbitro = parseNumber(idArbitro)
    const mesarioValue = mesario.trim()
    const competicao = getGameCompetition(formData)

    return teams.flatMap((team, teamIndex) => {
      const teamName = getTeamName(team)
      const players = Array.isArray(team?.jogadores) ? team.jogadores : []

      return players
        .map((player, playerIndex) => {
          const key = getPlayerKey(teamIndex, playerIndex, player)
          const state = playerStates[key] ?? createPlayerFormState(player)

          if (!state.selected) return null

          return {
            jogo: id,
            time: teamName,
            nomeJogador: getPlayerName(player),
            categoria: getGameCategory(formData, team, player),
            competicao,
            arbitro,
            mesario: mesarioValue,
            cartaoAmarelo: toInputNumber(state.cartaoAmarelo),
            cartaoVermelho: toInputNumber(state.cartaoVermelho),
            gols: toInputNumber(state.gols),
            capitao: state.capitao ? 1 : 0,
            tipoJogador: player?.tipoJogador ?? player?.tipo ?? player?.tipoJogadorSumula ?? '',
          }
        })
        .filter(Boolean)
    })
  }

  const buildUpdatePayload = () => ({
    idArbitro: parseNumber(idArbitro),
    mesario: mesario.trim(),
    equipes: teams.map((team, teamIndex) => ({
      idEquipe: getTeamId(team),
      nome: getTeamName(team),
      jogadores: (Array.isArray(team?.jogadores) ? team.jogadores : [])
        .map((player, playerIndex) => {
          const key = getPlayerKey(teamIndex, playerIndex, player)
          const state = playerStates[key] ?? createPlayerFormState(player)

          if (!state.selected) return null

          return {
            idJogador: getPlayerId(player),
            nomeJogador: getPlayerName(player),
            cartaoAmarelo: toInputNumber(state.cartaoAmarelo),
            cartaoVermelho: toInputNumber(state.cartaoVermelho),
            gols: toInputNumber(state.gols),
            capitao: state.capitao ? 1 : 0,
            tipoJogador: player?.tipoJogador ?? player?.tipo ?? player?.tipoJogadorSumula ?? '',
          }
        })
        .filter(Boolean),
    })),
  })

  const countUpdatePayloadPlayers = (payload) =>
    payload.equipes.reduce((total, team) => total + team.jogadores.length, 0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    const id = parseNumber(loadedGameId || gameId)
    if (!id || !formData) {
      setFeedback({ type: 'danger', message: 'Busque os dados do jogo antes de salvar.' })
      return
    }
    if (!idArbitro) {
      setFeedback({ type: 'danger', message: 'Selecione o árbitro da partida.' })
      return
    }

    const payload = isUpdateMode ? buildUpdatePayload() : buildCreatePayload()
    const selectedPlayers = isUpdateMode ? countUpdatePayloadPlayers(payload) : payload.length
    if (selectedPlayers === 0) {
      setFeedback({ type: 'danger', message: 'Selecione ao menos um jogador para salvar.' })
      return
    }

    setIsSaving(true)
    try {
      if (isUpdateMode) {
        await updateSumula(id, payload)
      } else {
        await createSumulas(payload)
        setIsUpdateMode(true)
      }
      setFeedback({
        type: 'success',
        message: isUpdateMode ? 'Súmula atualizada com sucesso.' : 'Súmula salva com sucesso.',
      })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: isUpdateMode
          ? 'Não foi possível atualizar a súmula.'
          : 'Não foi possível salvar a súmula.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setFeedback(null)

    const id = parseNumber(loadedGameId || gameId)
    if (!id || !formData) {
      setFeedback({ type: 'danger', message: 'Busque os dados do jogo antes de excluir.' })
      return
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Deseja excluir a súmula do jogo ${id}?`)
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteSumula(id)
      setPlayerStates(buildDefaultPlayerStates(teams))
      setMesario('')
      setIdArbitro('')
      setIsUpdateMode(false)
      setFeedback({ type: 'success', message: 'Súmula excluída com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível excluir a súmula.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReset = () => {
    setGameId('')
    setLoadedGameId('')
    setFormData(null)
    setPlayerStates({})
    setIsUpdateMode(false)
    setMesario('')
    setIdArbitro('')
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilCheck} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Súmula</h4>
              <div className="text-medium-emphasis">
                Busque um jogo e informe os dados de participação, cartões, gols e capitão.
              </div>
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

        <CCard className="mb-4">
          <CCardHeader>
            <strong>Buscar jogo</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSearch}>
              <CRow className="g-3 align-items-end">
                <CCol md={4} lg={3}>
                  <CFormLabel htmlFor="sumula-id-jogo">ID do jogo</CFormLabel>
                  <CFormInput
                    id="sumula-id-jogo"
                    type="number"
                    min="1"
                    value={gameId}
                    onChange={({ target }) => setGameId(target.value)}
                    disabled={isLoading || isSaving || isDeleting}
                  />
                </CCol>
                <CCol md="auto">
                  <CButton
                    color="primary"
                    type="submit"
                    disabled={isLoading || isSaving || isDeleting}
                  >
                    <CIcon icon={cilSearch} className="me-2" />
                    {isLoading ? 'Buscando...' : 'Buscar'}
                  </CButton>
                </CCol>
                <CCol md="auto">
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading || isSaving || isDeleting}
                  >
                    <CIcon icon={cilReload} className="me-2" />
                    Limpar
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      {isLoading && (
        <CCol xs={12}>
          <div className="text-center text-medium-emphasis">
            <CSpinner size="sm" className="me-2" /> Carregando dados da súmula...
          </div>
        </CCol>
      )}

      {formData && !isLoading && (
        <CCol xs={12}>
          <CForm onSubmit={handleSubmit}>
            <CCard className="mb-4">
              <CCardHeader>
                <strong>Dados da partida</strong>
                {formData?.jogo && (
                  <div className="small text-medium-emphasis">
                    Jogo {formData.jogo.codigo ?? loadedGameId} - {formData.jogo.equipe1 ?? '-'} x{' '}
                    {formData.jogo.equipe2 ?? '-'}
                  </div>
                )}
                <div className="small text-medium-emphasis">
                  {isUpdateMode ? 'Modo: atualização de súmula existente' : 'Modo: nova súmula'}
                </div>
              </CCardHeader>
              <CCardBody>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="sumula-mesario">Mesário</CFormLabel>
                    <CFormInput
                      id="sumula-mesario"
                      value={mesario}
                      onChange={({ target }) => setMesario(target.value)}
                      disabled={isSaving}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="sumula-arbitro">Árbitro</CFormLabel>
                    <CFormSelect
                      id="sumula-arbitro"
                      value={idArbitro}
                      onChange={({ target }) => setIdArbitro(target.value)}
                      disabled={isSaving}
                      required
                    >
                      <option value="">Selecione</option>
                      {(Array.isArray(formData?.arbitros) ? formData.arbitros : []).map(
                        (arbitro) => (
                          <option key={arbitro.id} value={arbitro.id}>
                            {arbitro.nome}
                          </option>
                        ),
                      )}
                    </CFormSelect>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CRow className="g-4">
              {teams.map((team, teamIndex) => {
                const summary = teamSummaries[teamIndex] ?? {
                  participantes: 0,
                  gols: 0,
                  amarelos: 0,
                  vermelhos: 0,
                }

                return (
                  <CCol lg={6} key={`${getTeamId(team) ?? teamIndex}-${getTeamName(team)}`}>
                    <CCard className="h-100">
                      <CCardHeader>
                        <strong>{getTeamName(team)}</strong>
                        <div className="small text-medium-emphasis">
                          {(Array.isArray(team?.jogadores) ? team.jogadores : []).length} jogadores
                        </div>
                        <CRow className="g-2 mt-2">
                          <CCol xs={6} sm={3}>
                            <div className="small text-medium-emphasis">Participaram</div>
                            <div className="fw-semibold">{summary.participantes}</div>
                          </CCol>
                          <CCol xs={6} sm={3}>
                            <div className="small text-medium-emphasis">Gols</div>
                            <div className="fw-semibold">{summary.gols}</div>
                          </CCol>
                          <CCol xs={6} sm={3}>
                            <div className="small text-medium-emphasis">Amarelos</div>
                            <div className="fw-semibold">{summary.amarelos}</div>
                          </CCol>
                          <CCol xs={6} sm={3}>
                            <div className="small text-medium-emphasis">Vermelhos</div>
                            <div className="fw-semibold">{summary.vermelhos}</div>
                          </CCol>
                        </CRow>
                      </CCardHeader>
                      <CCardBody className="d-flex flex-column gap-3">
                        {(Array.isArray(team?.jogadores) ? team.jogadores : []).map(
                          (player, playerIndex) => {
                            const key = getPlayerKey(teamIndex, playerIndex, player)
                            const state = playerStates[key] ?? createPlayerFormState(player)

                            return (
                              <div className="border rounded p-3" key={key}>
                                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                                  <div className="fw-semibold">{getPlayerName(player)}</div>
                                  <CFormCheck
                                    id={`sumula-player-${key}`}
                                    label="Participou"
                                    checked={state.selected}
                                    onChange={({ target }) =>
                                      handlePlayerChange(key, 'selected', target.checked)
                                    }
                                    disabled={isSaving}
                                  />
                                </div>
                                <CRow className="g-2 align-items-end">
                                  <CCol xs={6} sm={3}>
                                    <CFormLabel className="small" htmlFor={`sumula-gols-${key}`}>
                                      Gols
                                    </CFormLabel>
                                    <CFormInput
                                      id={`sumula-gols-${key}`}
                                      type="number"
                                      min="0"
                                      value={state.gols}
                                      onChange={({ target }) =>
                                        handlePlayerChange(key, 'gols', target.value)
                                      }
                                      disabled={isSaving || !state.selected}
                                    />
                                  </CCol>
                                  <CCol xs={6} sm={3}>
                                    <CFormLabel className="small" htmlFor={`sumula-amarelo-${key}`}>
                                      Amarelos
                                    </CFormLabel>
                                    <CFormInput
                                      id={`sumula-amarelo-${key}`}
                                      type="number"
                                      min="0"
                                      value={state.cartaoAmarelo}
                                      onChange={({ target }) =>
                                        handlePlayerChange(key, 'cartaoAmarelo', target.value)
                                      }
                                      disabled={isSaving || !state.selected}
                                    />
                                  </CCol>
                                  <CCol xs={6} sm={3}>
                                    <CFormLabel
                                      className="small"
                                      htmlFor={`sumula-vermelho-${key}`}
                                    >
                                      Vermelhos
                                    </CFormLabel>
                                    <CFormInput
                                      id={`sumula-vermelho-${key}`}
                                      type="number"
                                      min="0"
                                      value={state.cartaoVermelho}
                                      onChange={({ target }) =>
                                        handlePlayerChange(key, 'cartaoVermelho', target.value)
                                      }
                                      disabled={isSaving || !state.selected}
                                    />
                                  </CCol>
                                  <CCol xs={6} sm={3}>
                                    <CFormCheck
                                      id={`sumula-capitao-${key}`}
                                      label="Capitão"
                                      checked={state.capitao}
                                      onChange={({ target }) =>
                                        handlePlayerChange(key, 'capitao', target.checked)
                                      }
                                      disabled={isSaving || !state.selected}
                                    />
                                  </CCol>
                                </CRow>
                              </div>
                            )
                          },
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>

            <div className="d-flex gap-2 mt-4">
              <CButton color="primary" type="submit" disabled={isSaving || isDeleting}>
                <CIcon icon={cilSave} className="me-2" />
                {isSaving
                  ? isUpdateMode
                    ? 'Atualizando...'
                    : 'Salvando...'
                  : isUpdateMode
                    ? 'Atualizar súmula'
                    : 'Salvar súmula'}
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                type="button"
                onClick={() => setPlayerStates(buildDefaultPlayerStates(teams))}
                disabled={isSaving || isDeleting}
              >
                <CIcon icon={cilReload} className="me-2" />
                Marcar todos
              </CButton>
              <CButton
                color="danger"
                variant="outline"
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting || !isUpdateMode}
              >
                <CIcon icon={cilTrash} className="me-2" />
                {isDeleting ? 'Excluindo...' : 'Excluir súmula'}
              </CButton>
            </div>
          </CForm>
        </CCol>
      )}
    </CRow>
  )
}

export default SumulasCrud
