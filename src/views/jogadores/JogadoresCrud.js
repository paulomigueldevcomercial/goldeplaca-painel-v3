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
import { cilArrowRight, cilPlus, cilReload, cilSave, cilTrash, cilUser } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import CategorySelect from '../../components/forms/CategorySelect'
import { listEquipes } from '../../services/equipeApi'
import {
  createJogador,
  deleteJogador,
  listJogadores,
  updateJogador,
} from '../../services/jogadorApi'

const PLAYER_IMAGE_BASE_PATH = '/images/jogadores'
const PLAYER_PROFILE_IMAGE_BASE_PATH = '/images/jogadores/perfil'
const MAX_PLAYER_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_PLAYER_IMAGE_SIZE_LABEL = '10 MB'
const ACCEPTED_PLAYER_IMAGE_TYPES = 'image/jpeg,image/png,.jpg,.jpeg,.png'
const ALLOWED_PLAYER_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
const PLAYER_IMAGE_UPLOAD_OPTIONS = {
  img: { maxWidth: 900, maxHeight: 900, maxBytes: 450 * 1024, quality: 0.72 },
  imgPerfil: { maxWidth: 500, maxHeight: 500, maxBytes: 220 * 1024, quality: 0.72 },
}

const createEmptyPlayer = () => ({
  id: '',
  matricula: '',
  nomeJogador: '',
  time: '',
  categoria: '',
  competicao: '',
  dataNascimento: '',
  gols: 0,
  amarelo: 0,
  vermelho: 0,
  golContra: 0,
  cartao: '',
  jgd: 'Jgd',
  situacaoAtleta: 'AA',
  at: 'OK',
  sumula: 'HO',
  img: '',
  imgPerfil: '',
  imgFile: null,
  imgFileName: '',
  imgPerfilFile: null,
  imgPerfilFileName: '',
})

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const isSupportedImageFile = (file) => {
  const extension = file.name?.split('.').pop()?.toLowerCase()
  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    ALLOWED_PLAYER_IMAGE_EXTENSIONS.has(extension)
  )
}

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível carregar a imagem.'))
    }
    image.src = url
  })

const createImageBlob = (image, width, height, quality) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })

const compactImageFile = async (file, { maxWidth, maxHeight, maxBytes, quality }) => {
  if (!file?.type?.startsWith('image/')) return file

  const image = await loadImage(file)
  const sizeRatio = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
  let width = Math.max(1, Math.round(image.width * sizeRatio))
  let height = Math.max(1, Math.round(image.height * sizeRatio))
  let currentQuality = quality
  let compactedBlob = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    compactedBlob = await createImageBlob(image, width, height, currentQuality)
    if (!compactedBlob) return file
    if (compactedBlob.size <= maxBytes) break

    if (currentQuality > 0.52) {
      currentQuality -= 0.08
    } else {
      width = Math.max(1, Math.round(width * 0.85))
      height = Math.max(1, Math.round(height * 0.85))
    }
  }

  if (!compactedBlob || compactedBlob.size >= file.size) return file

  const fileName = file.name.replace(/\.[^.]+$/, '.jpg')
  return new File([compactedBlob], fileName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const parseNonNegativeNumberOrZero = (value) => {
  const parsed = parseNumber(value)
  return Math.max(0, parsed ?? 0)
}

const resolveStaticImageUrl = (value, basePath) => {
  if (!value) return ''

  const imageValue = String(value).trim()
  if (!imageValue || imageValue.startsWith('data:') || imageValue.startsWith('blob:')) {
    return imageValue
  }

  const fileName = imageValue.split('?')[0].split('#')[0].split('/').filter(Boolean).pop()
  return fileName ? `${basePath}/${fileName}` : ''
}

const JogadoresCrud = () => {
  const [formTeams, setFormTeams] = useState([])
  const [filterTeams, setFilterTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [formData, setFormData] = useState(createEmptyPlayer())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [playerSearch, setPlayerSearch] = useState('')
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)

  const loadPlayers = useCallback(async () => {
    if (!selectedCompetitionId || !selectedCategoryId || !selectedTeamFilter) {
      setPlayers([])
      return
    }

    setIsLoading(true)
    try {
      const playerData = await listJogadores({
        competicaoId: selectedCompetitionId,
        categoria: selectedCategoryId,
        time: selectedTeamFilter,
      })
      setPlayers(Array.isArray(playerData) ? playerData : [])
    } catch (error) {
      setPlayers([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os jogadores.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId, selectedCategoryId, selectedTeamFilter])

  const loadFormTeams = useCallback(async () => {
    if (!selectedCompetitionId || !formData.categoria) {
      setFormTeams([])
      return
    }

    try {
      const teamData = await listEquipes({
        competicaoId: selectedCompetitionId,
        categoria: formData.categoria,
      })
      setFormTeams(Array.isArray(teamData) ? teamData : [])
    } catch (error) {
      setFormTeams([])
    }
  }, [formData.categoria, selectedCompetitionId])

  const loadFilterTeams = useCallback(async () => {
    if (!selectedCompetitionId || !selectedCategoryId) {
      setFilterTeams([])
      return
    }

    try {
      const teamData = await listEquipes({
        competicaoId: selectedCompetitionId,
        categoria: selectedCategoryId,
      })
      setFilterTeams(Array.isArray(teamData) ? teamData : [])
    } catch (error) {
      setFilterTeams([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as equipes da categoria.' })
    }
  }, [selectedCompetitionId, selectedCategoryId])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    loadFormTeams()
  }, [loadFormTeams])

  useEffect(() => {
    loadFilterTeams()
  }, [loadFilterTeams])

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedTeamFilter('')
      return
    }

    const hasSelectedTeam = filterTeams.some(
      (team) => String(team.equipe) === String(selectedTeamFilter),
    )
    if (hasSelectedTeam) return

    const defaultTeam = filterTeams[0]?.equipe ?? ''
    if (defaultTeam !== selectedTeamFilter) {
      setSelectedTeamFilter(defaultTeam)
    }
  }, [filterTeams, selectedCategoryId, selectedTeamFilter])

  useEffect(() => {
    setSelectedCategoryId('')
    setSelectedTeamFilter('')
    setSelectedPlayerId(null)
    setPlayerSearch('')
    setPlayers([])
    setFilterTeams([])
    setFormTeams([])
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedPlayerId) return
    const player = players.find((item) => String(item.id) === String(selectedPlayerId))
    if (!player) return

    setFormData({
      ...createEmptyPlayer(),
      ...player,
      competicao: player.competicao ?? selectedCompetitionId,
      categoria: player.categoria ?? '',
      time: player.time ?? '',
      gols: player.gols ?? 0,
      amarelo: player.amarelo ?? 0,
      vermelho: player.vermelho ?? 0,
      golContra: player.golContra ?? player.gols_contra ?? 0,
      jgd: player.jgd || 'Jgd',
      situacaoAtleta: player.situacaoAtleta || 'AA',
      at: player.at || 'OK',
      sumula: player.sumula || 'HO',
      img: resolveStaticImageUrl(player.img, PLAYER_IMAGE_BASE_PATH),
      imgPerfil: resolveStaticImageUrl(
        player.imgPerfil ?? player.img_perfil,
        PLAYER_PROFILE_IMAGE_BASE_PATH,
      ),
      imgFileName: '',
      imgFile: null,
      imgPerfilFile: null,
      imgPerfilFileName: '',
    })
  }, [selectedPlayerId, players, selectedCompetitionId])

  useEffect(() => {
    if (selectedPlayerId) return

    setFormData((previous) => ({
      ...previous,
      competicao: selectedCompetitionId,
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

  const handleCategoryFilterChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedTeamFilter('')
    setSelectedPlayerId(null)
    setPlayerSearch('')
    setPlayers([])
    setFeedback(null)
  }

  const handleTeamFilterChange = ({ target }) => {
    setSelectedTeamFilter(target.value)
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
    setFeedback(null)
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleCategoryChange = (newCategoryId) => {
    setFeedback(null)
    setFormData((previous) => ({
      ...previous,
      categoria: newCategoryId,
      time: '',
    }))
  }

  const handleTeamChange = ({ target }) => {
    setFeedback(null)
    setFormData((previous) => ({ ...previous, time: target.value }))
  }

  const handleImageChange = async ({ target }, field, fileField) => {
    const file = target.files?.[0]
    if (!file) return

    if (!isSupportedImageFile(file)) {
      target.value = ''
      setFeedback({ type: 'danger', message: 'Selecione uma imagem JPG ou PNG válida.' })
      return
    }

    if (file.size > MAX_PLAYER_IMAGE_SIZE_BYTES) {
      target.value = ''
      setFeedback({
        type: 'danger',
        message: `A imagem selecionada ultrapassa ${MAX_PLAYER_IMAGE_SIZE_LABEL}.`,
      })
      return
    }

    try {
      const compactedFile = await compactImageFile(file, PLAYER_IMAGE_UPLOAD_OPTIONS[field])
      const dataUrl = await readFileAsDataUrl(compactedFile)
      setFormData((previous) => ({
        ...previous,
        [field]: dataUrl,
        [`${field}File`]: compactedFile,
        [fileField]: `${compactedFile.name} (${formatFileSize(compactedFile.size)})`,
      }))
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível carregar a imagem selecionada.' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedValues = Object.fromEntries(new FormData(event.currentTarget).entries())
    setFeedback(null)

    if (!selectedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição no menu lateral.' })
      return
    }
    if (
      !(submittedValues.categoria || formData.categoria) ||
      !(submittedValues.nomeJogador || formData.nomeJogador)
    ) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios.' })
      return
    }

    setIsLoading(true)
    try {
      const {
        img,
        imgPerfil,
        imgFile,
        imgFileName,
        imgPerfilFile,
        imgPerfilFileName,
        img_perfil,
        gols_contra,
        representante,
        tecnico,
        ...playerData
      } = formData
      const payload = {
        ...playerData,
        ...submittedValues,
        id: selectedPlayerId ?? (formData.id || undefined),
        competicao: parseNumber(selectedCompetitionId),
        gols: parseNonNegativeNumberOrZero(submittedValues.gols ?? formData.gols),
        amarelo: parseNonNegativeNumberOrZero(submittedValues.amarelo ?? formData.amarelo),
        vermelho: parseNonNegativeNumberOrZero(submittedValues.vermelho ?? formData.vermelho),
        golContra: parseNonNegativeNumberOrZero(submittedValues.golContra ?? formData.golContra),
        jgd: submittedValues.jgd || formData.jgd || 'Jgd',
        situacaoAtleta: submittedValues.situacaoAtleta || formData.situacaoAtleta || 'AA',
        at: submittedValues.at || formData.at || 'OK',
        sumula: submittedValues.sumula || formData.sumula || 'HO',
      }

      if (selectedPlayerId) {
        await updateJogador(selectedPlayerId, payload, imgFile, imgPerfilFile)
        setFeedback({ type: 'success', message: 'Dados do jogador atualizados com sucesso.' })
      } else {
        const created = await createJogador(payload, imgFile, imgPerfilFile)
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
        competicao: selectedCompetitionId,
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
      competicao: selectedCompetitionId,
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
              <SelectedCompetitionBadge className="mt-2" />
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
                <div className="small text-medium-emphasis">
                  Filtrados pela competição selecionada e categoria
                </div>
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
              <CFormSelect
                size="sm"
                value={selectedTeamFilter}
                onChange={handleTeamFilterChange}
                disabled={!selectedCategoryId}
                aria-label="Selecionar equipe para filtrar"
              >
                <option value="">{selectedCategoryId ? 'Equipe' : 'Selecione a categoria'}</option>
                {filterTeams.map((team) => (
                  <option key={team.id} value={team.equipe}>
                    {team.equipe}
                  </option>
                ))}
              </CFormSelect>
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
            ) : !selectedCompetitionId ? (
              <div className="p-3 text-medium-emphasis">
                Selecione uma competição no menu lateral.
              </div>
            ) : !selectedCategoryId ? (
              <div className="p-3 text-medium-emphasis">
                Selecione uma categoria para listar os jogadores.
              </div>
            ) : !selectedTeamFilter ? (
              <div className="p-3 text-medium-emphasis">
                Selecione uma equipe para listar os jogadores.
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">
                Nenhum jogador cadastrado para esta competição.
              </div>
            ) : visiblePlayers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">
                Nenhum jogador encontrado para o termo buscado.
              </div>
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
                        <small className="text-medium-emphasis">
                          Matrícula {player.matricula || 'não informada'}
                        </small>
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
                <CCol md={3}>
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
                <CCol md={3}>
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
                <CCol md={3}>
                  <CFormLabel htmlFor="player-type">Tipo</CFormLabel>
                  <CFormSelect
                    id="player-type"
                    name="jgd"
                    value={formData.jgd}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Jgd">Jogador</option>
                    <option value="Gol">Goleiro</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="player-status">Situação do atleta</CFormLabel>
                  <CFormSelect
                    id="player-status"
                    name="situacaoAtleta"
                    value={formData.situacaoAtleta}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="AA">AA</option>
                    <option value="ES">ES</option>
                    <option value="EX">EX</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="player-at">Atestado</CFormLabel>
                  <CFormSelect
                    id="player-at"
                    name="at"
                    value={formData.at}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="OK">OK</option>
                    <option value="AT">Atestado</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="player-sumula">Súmula</CFormLabel>
                  <CFormSelect
                    id="player-sumula"
                    name="sumula"
                    value={formData.sumula}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="HO">Homologado</option>
                    <option value="NH">Não homologado</option>
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
                <CCol md={6}>
                  <CategorySelect
                    id="player-category"
                    name="categoria"
                    competitionId={selectedCompetitionId}
                    value={formData.categoria}
                    onValueChange={handleCategoryChange}
                    onError={(message) => setFeedback({ type: 'danger', message })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="player-team">Equipe</CFormLabel>
                  <CFormSelect
                    id="player-team"
                    name="time"
                    value={formData.time}
                    onChange={handleTeamChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {formTeams.map((team) => (
                      <option key={team.id} value={team.equipe}>
                        {team.equipe}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4} lg={3}>
                  <CFormLabel htmlFor="player-gols">Gols</CFormLabel>
                  <CFormInput
                    id="player-gols"
                    name="gols"
                    type="number"
                    min="0"
                    value={formData.gols}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4} lg={3}>
                  <CFormLabel htmlFor="player-amarelo">Cartões amarelos</CFormLabel>
                  <CFormInput
                    id="player-amarelo"
                    name="amarelo"
                    type="number"
                    min="0"
                    value={formData.amarelo}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={4} lg={3}>
                  <CFormLabel htmlFor="player-vermelho">Cartões vermelhos</CFormLabel>
                  <CFormInput
                    id="player-vermelho"
                    name="vermelho"
                    type="number"
                    min="0"
                    value={formData.vermelho}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6} lg={3}>
                  <CFormLabel htmlFor="player-cartao">Cartão</CFormLabel>
                  <CFormSelect
                    id="player-cartao"
                    name="cartao"
                    value={formData.cartao}
                    onChange={handleInputChange}
                  >
                    <option value="">Sem cartão</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Pendurado">Pendurado</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6} lg={3}>
                  <CFormLabel htmlFor="player-gol-contra">Gols contra</CFormLabel>
                  <CFormInput
                    id="player-gol-contra"
                    name="golContra"
                    type="number"
                    min="0"
                    value={formData.golContra}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="player-image">Imagem do jogador (arquivo)</CFormLabel>
                <CFormInput
                  id="player-image"
                  type="file"
                  accept={ACCEPTED_PLAYER_IMAGE_TYPES}
                  onChange={(event) => handleImageChange(event, 'img', 'imgFileName')}
                />
                {formData.imgFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imgFileName}</div>
                )}
              </div>

              <div>
                <CFormLabel htmlFor="player-profile-image">Imagem de perfil (arquivo)</CFormLabel>
                <CFormInput
                  id="player-profile-image"
                  type="file"
                  accept={ACCEPTED_PLAYER_IMAGE_TYPES}
                  onChange={(event) => handleImageChange(event, 'imgPerfil', 'imgPerfilFileName')}
                />
                {formData.imgPerfilFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imgPerfilFileName}</div>
                )}
              </div>

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
                        Pré-visualização da imagem principal.{' '}
                        <CIcon icon={cilArrowRight} className="mx-1" /> Atualize o arquivo para
                        trocar.
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
                        Pré-visualização da imagem de perfil.{' '}
                        <CIcon icon={cilArrowRight} className="mx-1" /> Atualize o arquivo para
                        trocar.
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
