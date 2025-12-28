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
  CListGroup,
  CListGroupItem,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowRight, cilPlus, cilReload, cilSave, cilTrash, cilUser } from '@coreui/icons'
import { fetchPlayerSetup } from '../../services/playerApi'

const createEmptyPlayer = (competitionId = '', categoryId = '', teamId = '') => ({
  registration: '',
  playerType: '',
  name: '',
  imageUrl: '',
  imageFileName: '',
  birthDate: '',
  competitionId,
  categoryId,
  teamId,
})

const JogadoresCrud = () => {
  const [competitions, setCompetitions] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [formData, setFormData] = useState(createEmptyPlayer())
  const [feedback, setFeedback] = useState(null)

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === selectedCompetitionId) ?? null,
    [competitions, selectedCompetitionId],
  )

  const categories = selectedCompetition?.categories ?? []
  const teams = useMemo(() => {
    if (!selectedCompetition) return []

    if (!formData.categoryId) return selectedCompetition.teams
    return selectedCompetition.teams.filter((team) => team.categoryId === formData.categoryId)
  }, [selectedCompetition, formData.categoryId])

  useEffect(() => {
    fetchPlayerSetup().then(({ competitions: competitionData, players: playersData }) => {
      setCompetitions(competitionData)
      setPlayers(playersData)

      if (!competitionData.length) return

      setSelectedCompetitionId((previous) => previous ?? competitionData[0].id)
      setFormData((previous) => {
        const baseCompetitionId = previous.competitionId || competitionData[0].id
        const competition = competitionData.find((item) => item.id === baseCompetitionId) ?? competitionData[0]
        const defaultCategoryId = competition.categories[0]?.id ?? ''
        const defaultTeamId =
          competition.teams.find((team) => team.categoryId === defaultCategoryId)?.id ?? ''

        return {
          ...createEmptyPlayer(baseCompetitionId, defaultCategoryId, defaultTeamId),
          registration: previous.registration,
          playerType: previous.playerType,
          name: previous.name,
          birthDate: previous.birthDate,
          imageUrl: previous.imageUrl,
          imageFileName: previous.imageFileName,
        }
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedPlayerId) return

    const player = players.find((item) => item.id === selectedPlayerId)
    if (!player) return

    setFormData({ ...createEmptyPlayer(), ...player, imageFileName: player.imageFileName ?? '' })
  }, [selectedPlayerId, players])

  useEffect(() => {
    if (selectedPlayerId) return
    if (!selectedCompetition) return

    const defaultCategoryId = selectedCompetition.categories[0]?.id ?? ''
    const defaultTeamId =
      selectedCompetition.teams.find((team) => team.categoryId === defaultCategoryId)?.id ?? ''

    setFormData((previous) => ({
      ...createEmptyPlayer(selectedCompetition.id, defaultCategoryId, defaultTeamId),
      registration: previous.registration,
      playerType: previous.playerType,
      name: previous.name,
      birthDate: previous.birthDate,
      imageUrl: previous.imageUrl,
      imageFileName: previous.imageFileName,
    }))
  }, [selectedCompetition, selectedPlayerId])

  const filteredPlayers = useMemo(
    () => players.filter((player) => player.competitionId === selectedCompetitionId),
    [players, selectedCompetitionId],
  )

  const handleCompetitionFilterChange = ({ target }) => {
    setSelectedCompetitionId(target.value)
    setSelectedPlayerId(null)
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
      ...(name === 'imageUrl' ? { imageFileName: '' } : null),
    }))
  }

  const handleCompetitionChange = ({ target }) => {
    const newCompetitionId = target.value
    const competition = competitions.find((item) => item.id === newCompetitionId)
    const newCategoryId = competition?.categories[0]?.id ?? ''
    const newTeamId = competition?.teams.find((team) => team.categoryId === newCategoryId)?.id ?? ''

    setFormData((previous) => ({
      ...previous,
      competitionId: newCompetitionId,
      categoryId: newCategoryId,
      teamId: newTeamId,
    }))
  }

  const handleCategoryChange = ({ target }) => {
    const newCategoryId = target.value
    const newTeamId = teams.find((team) => team.categoryId === newCategoryId)?.id ?? ''

    setFormData((previous) => ({
      ...previous,
      categoryId: newCategoryId,
      teamId: newTeamId,
    }))
  }

  const handleTeamChange = ({ target }) => {
    setFormData((previous) => ({ ...previous, teamId: target.value }))
  }

  const handlePlayerFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      imageUrl: objectUrl,
      imageFileName: file.name,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.competitionId || !formData.categoryId || !formData.teamId) return

    const playerId = selectedPlayerId ?? `pl-${Date.now()}`
    const payload = {
      ...formData,
      id: playerId,
    }

    setPlayers((previous) => {
      const exists = previous.some((item) => item.id === playerId)
      return exists
        ? previous.map((player) => (player.id === playerId ? payload : player))
        : [...previous, payload]
    })

    setSelectedPlayerId(playerId)
    setFeedback(selectedPlayerId ? 'Dados do jogador atualizados com sucesso.' : 'Jogador cadastrado com sucesso.')
  }

  const handleDelete = () => {
    if (!selectedPlayerId) return

    setPlayers((previous) => previous.filter((player) => player.id !== selectedPlayerId))
    setSelectedPlayerId(null)
    setFormData(createEmptyPlayer(selectedCompetitionId ?? ''))
    setFeedback('Jogador removido do cadastro.')
  }

  const handleReset = () => {
    const categoryId = selectedCompetition?.categories[0]?.id ?? ''
    const teamId = selectedCompetition?.teams.find((team) => team.categoryId === categoryId)?.id ?? ''

    setSelectedPlayerId(null)
    setFormData(createEmptyPlayer(selectedCompetitionId ?? '', categoryId, teamId))
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilUser} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Cadastro de Jogadores</h4>
              <div className="text-medium-emphasis">
                Gerencie o registro de atletas por competição. Os dados são mantidos apenas em memória para demonstrar o fluxo do CRUD.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Jogadores</strong>
              <div className="small text-medium-emphasis">Filtrados por competição</div>
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
            {filteredPlayers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum jogador cadastrado para esta competição.</div>
            ) : (
              <CListGroup flush>
                {filteredPlayers.map((player) => (
                  <CListGroupItem
                    key={player.id}
                    action
                    active={player.id === selectedPlayerId}
                    onClick={() => handlePlayerSelect(player.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{player.name}</div>
                        <small className="text-medium-emphasis">Matrícula {player.registration}</small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <CBadge color="secondary" shape="rounded-pill">
                          {player.playerType || 'Tipo não informado'}
                        </CBadge>
                        <CBadge color="info" shape="rounded-pill">
                          {selectedCompetition?.teams.find((team) => team.id === player.teamId)?.name || 'Equipe não informada'}
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
              <strong>{selectedPlayerId ? 'Editar jogador' : 'Novo jogador'}</strong>
              <div className="small text-medium-emphasis">Preencha todos os campos obrigatórios para salvar.</div>
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
                    name="registration"
                    placeholder="Ex.: MAT-1200"
                    value={formData.registration}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-type">Tipo de jogador</CFormLabel>
                  <CFormSelect
                    id="player-type"
                    name="playerType"
                    value={formData.playerType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Atleta">Atleta</option>
                    <option value="Goleiro">Goleiro</option>
                    <option value="Comissão técnica">Comissão técnica</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="player-birth">Data de nascimento</CFormLabel>
                  <CFormInput
                    id="player-birth"
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="player-name">Nome completo</CFormLabel>
                <CFormInput
                  id="player-name"
                  name="name"
                  placeholder="Nome do atleta"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="player-image-upload">Imagem do jogador</CFormLabel>
                <CFormInput
                  id="player-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePlayerFileChange}
                />
                {formData.imageFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                )}
              </div>

              <div>
                <CFormLabel htmlFor="player-image-url">URL da imagem (opcional)</CFormLabel>
                <CFormInput
                  id="player-image-url"
                  name="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>

              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="player-competition">Competição</CFormLabel>
                  <CFormSelect
                    id="player-competition"
                    name="competitionId"
                    value={formData.competitionId}
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
                  <CFormLabel htmlFor="player-category">Categoria</CFormLabel>
                  <CFormSelect
                    id="player-category"
                    name="categoryId"
                    value={formData.categoryId}
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
                  <CFormLabel htmlFor="player-team">Equipe</CFormLabel>
                  <CFormSelect
                    id="player-team"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleTeamChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </CFormSelect>
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
                  disabled={!selectedPlayerId}
                  onClick={handleDelete}
                >
                  <CIcon icon={cilTrash} className="me-2" /> Remover
                </CButton>
              </div>

              {formData.imageUrl && (
                <div className="d-flex align-items-center gap-2 border-top pt-3">
                  <img src={formData.imageUrl} alt={formData.name || 'Jogador'} width={72} height={72} className="rounded" />
                  <div className="text-medium-emphasis">
                    Pré-visualização da imagem fornecida. <CIcon icon={cilArrowRight} className="mx-1" /> Atualize o arquivo ou URL para trocar.
                  </div>
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
