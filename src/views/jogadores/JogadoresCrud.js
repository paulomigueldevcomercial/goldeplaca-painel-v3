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
import { cilArrowRight, cilPlus, cilReload, cilSave, cilTrash, cilUser } from '@coreui/icons'
import CategorySelect from '../../components/forms/CategorySelect'
import CompetitionSelect from '../../components/forms/CompetitionSelect'
import { listEquipes } from '../../services/equipeApi'
import { createJogador, deleteJogador, listJogadores, updateJogador } from '../../services/jogadorApi'

const createEmptyPlayer = () => ({
  id: '',
  matricula: '',
  nomeJogador: '',
  time: '',
  categoria: '',
  competicao: '',
  dataNascimento: '',
  gols: '',
  amarelo: '',
  vermelho: '',
  cartao: '',
  situacaoAtleta: '',
  representante: '',
  tecnico: '',
  img: '',
  imgPerfil: '',
  imgFileName: '',
  imgPerfilFileName: '',
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

const JogadoresCrud = () => {
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [formData, setFormData] = useState(createEmptyPlayer())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [playerSearch, setPlayerSearch] = useState('')

  const loadPlayers = useCallback(async () => {
    if (!selectedCompetitionId) return

    setIsLoading(true)
    try {
      const playerData = await listJogadores({
        competicaoId: selectedCompetitionId,
        categoria: selectedCategoryId || undefined,
      })
      setPlayers(Array.isArray(playerData) ? playerData : [])
    } catch (error) {
      setPlayers([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os jogadores.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId, selectedCategoryId])

  const loadTeams = useCallback(async () => {
    if (!formData.competicao || !formData.categoria) {
      setTeams([])
      return
    }

    try {
      const teamData = await listEquipes({
        competicaoId: formData.competicao,
        categoria: formData.categoria,
      })
      setTeams(Array.isArray(teamData) ? teamData : [])
    } catch (error) {
      setTeams([])
    }
  }, [formData.competicao, formData.categoria])

  useEffect(() => {
    if (!selectedCompetitionId) return
    loadPlayers()
  }, [selectedCompetitionId, selectedCategoryId, loadPlayers])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  useEffect(() => {
    if (!selectedPlayerId) return
    const player = players.find((item) => String(item.id) === String(selectedPlayerId))
    if (!player) return

    setFormData({
      ...createEmptyPlayer(),
      ...player,
      competicao: player.competicao ?? formData.competicao,
      categoria: player.categoria ?? formData.categoria,
      time: player.time ?? '',
      imgFileName: '',
      imgPerfilFileName: '',
    })
  }, [selectedPlayerId, players])

  useEffect(() => {
    if (selectedPlayerId) return

    setFormData((previous) => ({
      ...previous,
      competicao: previous.competicao || selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
  }, [selectedCompetitionId, selectedCategoryId, selectedPlayerId])

  const filteredPlayers = useMemo(() => players, [players])

  const visiblePlayers = useMemo(() => {
    const searchTerm = playerSearch.trim().toLowerCase()
    if (!searchTerm) return filteredPlayers

    return filteredPlayers.filter(({ nomeJogador, matricula }) =>
      [nomeJogador, matricula].some((field) => {
        const normalizedField = field?.toLowerCase() ?? ''
        return normalizedField.includes(searchTerm)
      }),
    )
  }, [filteredPlayers, playerSearch])

  const handleCompetitionFilterChange = (competitionId) => {
    setSelectedCompetitionId(competitionId)
    setSelectedCategoryId('')
    setSelectedPlayerId(null)
    setPlayerSearch('')
    setFeedback(null)
  }

  const handleCategoryFilterChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedPlayerId(null)
    setPlayerSearch('')
    setFeedback(null)
  }

  const handlePlayerSelect = (playerId) => {
    setSelectedPlayerId(playerId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleCompetitionChange = (newCompetitionId) => {
    setFormData((previous) => ({
      ...previous,
      competicao: newCompetitionId,
    }))
  }

  const handleCategoryChange = (newCategoryId) => {
    setFormData((previous) => ({
      ...previous,
      categoria: newCategoryId,
    }))
  }

  const handleTeamChange = ({ target }) => {
    setFormData((previous) => ({ ...previous, time: target.value }))
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

    if (!formData.competicao || !formData.categoria || !formData.nomeJogador) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        id: selectedPlayerId ?? (formData.id || undefined),
        competicao: parseNumber(formData.competicao),
        gols: parseNumber(formData.gols),
        amarelo: parseNumber(formData.amarelo),
        vermelho: parseNumber(formData.vermelho),
      }

      if (selectedPlayerId) {
        await updateJogador(selectedPlayerId, payload)
        setFeedback({ type: 'success', message: 'Dados do jogador atualizados com sucesso.' })
      } else {
        const created = await createJogador(payload)
        setSelectedPlayerId(created?.id ?? payload.id ?? null)
        setFeedback({ type: 'success', message: 'Jogador cadastrado com sucesso.' })
      }

      await loadPlayers()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o jogador.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPlayerId) return

    setIsLoading(true)
    try {
      await deleteJogador(selectedPlayerId)
      setSelectedPlayerId(null)
      setFormData((previous) => ({
        ...createEmptyPlayer(),
        competicao: previous.competicao,
        categoria: previous.categoria,
      }))
      setFeedback({ type: 'success', message: 'Jogador removido do cadastro.' })
      await loadPlayers()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o jogador.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedPlayerId(null)
    setFormData((previous) => ({
      ...createEmptyPlayer(),
      competicao: previous.competicao || selectedCompetitionId,
      categoria: previous.categoria || selectedCategoryId,
    }))
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilUser} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Jogadores</h4>
              <div className="text-medium-emphasis">
                Gerencie o registro de atletas utilizando a API do painel.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Jogadores</strong>
                <div className="small text-medium-emphasis">Filtrados por competição e categoria</div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <CompetitionSelect
                label={null}
                placeholder="Competição"
                value={selectedCompetitionId}
                onValueChange={handleCompetitionFilterChange}
                size="sm"
                ariaLabel="Selecionar competição para filtrar"
                onError={(message) => setFeedback({ type: 'danger', message })}
              />
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
                value={playerSearch}
                onChange={({ target }) => setPlayerSearch(target.value)}
                placeholder="Pesquisar por nome ou matrícula"
                aria-label="Pesquisar jogadores"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center">
                <CSpinner size="sm" /> Carregando jogadores...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum jogador cadastrado para esta competição.</div>
            ) : visiblePlayers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum jogador encontrado para o termo buscado.</div>
            ) : (
              <CListGroup flush>
                {visiblePlayers.map((player) => (
                  <CListGroupItem
                    key={player.id}
                    action
                    active={String(player.id) === String(selectedPlayerId)}
                    onClick={() => handlePlayerSelect(player.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{player.nomeJogador}</div>
                        <small className="text-medium-emphasis">Matrícula {player.matricula || 'não informada'}</small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <CBadge color="secondary" shape="rounded-pill">
                          {player.time || 'Equipe não informada'}
                        </CBadge>
                        <CBadge color="info" shape="rounded-pill">
                          {player.categoria || 'Categoria não informada'}
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
              <strong>{selectedPlayerId ? 'Editar jogador' : 'Novo jogador'}</strong>
              <div className="small text-medium-emphasis">Preencha os campos obrigatórios para salvar.</div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={handleReset}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="player-registration">Matrícula</CFormLabel>
                  <CFormInput
                    id="player-registration"
                    name="matricula"
                    placeholder="Ex.: MAT-1200"
                    value={formData.matricula}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-birth">Data de nascimento</CFormLabel>
                  <CFormInput
                    id="player-birth"
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-status">Situação do atleta</CFormLabel>
                  <CFormSelect
                    id="player-status"
                    name="situacaoAtleta"
                    value={formData.situacaoAtleta}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Pendente">Pendente</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="player-name">Nome completo</CFormLabel>
                <CFormInput
                  id="player-name"
                  name="nomeJogador"
                  placeholder="Nome do atleta"
                  value={formData.nomeJogador}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <CRow className="g-3">
                <CCol md={4}>
                  <CompetitionSelect
                    id="player-competition"
                    name="competicao"
                    value={formData.competicao}
                    onValueChange={handleCompetitionChange}
                    onError={(message) => setFeedback({ type: 'danger', message })}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CategorySelect
                    id="player-category"
                    name="categoria"
                    competitionId={formData.competicao}
                    value={formData.categoria}
                    onValueChange={handleCategoryChange}
                    onError={(message) => setFeedback({ type: 'danger', message })}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-team">Equipe</CFormLabel>
                  <CFormSelect
                    id="player-team"
                    name="time"
                    value={formData.time}
                    onChange={handleTeamChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.equipe}>
                        {team.equipe}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="player-gols">Gols</CFormLabel>
                  <CFormInput
                    id="player-gols"
                    name="gols"
                    type="number"
                    value={formData.gols}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-amarelo">Cartões amarelos</CFormLabel>
                  <CFormInput
                    id="player-amarelo"
                    name="amarelo"
                    type="number"
                    value={formData.amarelo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-vermelho">Cartões vermelhos</CFormLabel>
                  <CFormInput
                    id="player-vermelho"
                    name="vermelho"
                    type="number"
                    value={formData.vermelho}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="player-representante">Representante</CFormLabel>
                  <CFormInput
                    id="player-representante"
                    name="representante"
                    value={formData.representante}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="player-tecnico">Técnico</CFormLabel>
                  <CFormInput
                    id="player-tecnico"
                    name="tecnico"
                    value={formData.tecnico}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="player-image">Imagem do jogador (arquivo)</CFormLabel>
                <CFormInput
                  id="player-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageChange(event, 'img', 'imgFileName')}
                />
                {formData.imgFileName && <div className="form-text">Arquivo selecionado: {formData.imgFileName}</div>}
              </div>

              <div>
                <CFormLabel htmlFor="player-image-url">Imagem do jogador (URL)</CFormLabel>
                <CFormInput
                  id="player-image-url"
                  name="img"
                  placeholder="https://..."
                  value={formData.img}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <CFormLabel htmlFor="player-profile-image">Imagem de perfil (arquivo)</CFormLabel>
                <CFormInput
                  id="player-profile-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageChange(event, 'imgPerfil', 'imgPerfilFileName')}
                />
                {formData.imgPerfilFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imgPerfilFileName}</div>
                )}
              </div>

              <div>
                <CFormLabel htmlFor="player-profile-url">Imagem de perfil (URL)</CFormLabel>
                <CFormInput
                  id="player-profile-url"
                  name="imgPerfil"
                  placeholder="https://..."
                  value={formData.imgPerfil}
                  onChange={handleInputChange}
                />
              </div>

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
                  disabled={!selectedPlayerId || isLoading}
                  onClick={handleDelete}
                >
                  <CIcon icon={cilTrash} className="me-2" /> Remover
                </CButton>
              </div>

              {(formData.img || formData.imgPerfil) && (
                <div className="d-flex flex-column gap-2 border-top pt-3">
                  {formData.img && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={formData.img}
                        alt={formData.nomeJogador || 'Jogador'}
                        width={72}
                        height={72}
                        className="rounded"
                      />
                      <div className="text-medium-emphasis">
                        Pré-visualização da imagem principal. <CIcon icon={cilArrowRight} className="mx-1" /> Atualize o
                        arquivo ou URL para trocar.
                      </div>
                    </div>
                  )}
                  {formData.imgPerfil && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={formData.imgPerfil}
                        alt={formData.nomeJogador || 'Perfil'}
                        width={72}
                        height={72}
                        className="rounded-circle"
                      />
                      <div className="text-medium-emphasis">
                        Pré-visualização da imagem de perfil. <CIcon icon={cilArrowRight} className="mx-1" /> Atualize o
                        arquivo ou URL para trocar.
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

export default JogadoresCrud
