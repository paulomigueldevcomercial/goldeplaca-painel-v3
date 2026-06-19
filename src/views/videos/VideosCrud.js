import React, { useCallback, useEffect, useState } from 'react'
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
import { cilExternalLink, cilMediaPlay, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import { createVideo, deleteVideo, listVideos, updateVideo } from '../../services/videoApi'

const createEmptyVideo = () => ({
  id: '',
  descricao: '',
  url: '',
  data: '',
  ativo: true,
  competicao: '',
})

const parseBooleanFilter = (value) => {
  if (value === '') return undefined
  return value === 'true'
}

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const formatVideoDate = (value) => {
  if (!value) return '-'

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (match) {
    const [, year, month, day, hour = '00', minute = '00'] = match
    return `${day}/${month}/${year} às ${hour}:${minute}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(',', ' às')
}

const toDateTimeInputValue = (value) => {
  if (!value) return ''

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
  if (match) return match[1]

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (entry) => String(entry).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const normalizeDateTimeForApi = (value) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

const getEmbeddableVideoUrl = (value) => {
  if (!value) return ''

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/embed/')) return value

      const pathParts = url.pathname.split('/').filter(Boolean)
      const videoId = url.searchParams.get('v') ?? (pathParts[0] === 'shorts' ? pathParts[1] : '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (host === 'vimeo.com') {
      const videoId = url.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ''
    }
  } catch (error) {
    return ''
  }

  return ''
}

const VideosCrud = () => {
  const [videos, setVideos] = useState([])
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const [formData, setFormData] = useState(createEmptyVideo())
  const [filters, setFilters] = useState({ ativo: '' })
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)

  useEffect(() => {
    setSelectedVideoId(null)
    setFormData(createEmptyVideo())
    setFilters({ ativo: '' })
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedVideoId) return

    const video = videos.find((item) => String(item.id) === String(selectedVideoId))
    if (!video) return

    setFormData({
      ...createEmptyVideo(),
      ...video,
      data: toDateTimeInputValue(video.data),
      ativo: video.ativo ?? true,
      competicao: video.competicao ?? selectedCompetitionId ?? '',
    })
  }, [selectedCompetitionId, selectedVideoId, videos])

  useEffect(() => {
    if (selectedVideoId) return
    setFormData((previous) => ({
      ...previous,
      competicao: selectedCompetitionId ?? '',
    }))
  }, [selectedCompetitionId, selectedVideoId])

  const loadVideos = useCallback(async () => {
    if (!selectedCompetitionId) {
      setVideos([])
      return
    }

    setIsLoading(true)
    try {
      const data = await listVideos({
        competicaoId: selectedCompetitionId,
        ativo: parseBooleanFilter(filters.ativo),
      })
      setVideos(Array.isArray(data) ? data : [])
    } catch (error) {
      setVideos([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os vídeos.' })
    } finally {
      setIsLoading(false)
    }
  }, [filters.ativo, selectedCompetitionId])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const handleVideoSelect = (videoId) => {
    setSelectedVideoId(videoId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: name === 'ativo' ? value === 'true' : value,
    }))
  }

  const handleFilterChange = ({ target }) => {
    const { name, value } = target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
    setSelectedVideoId(null)
  }

  const handleNewVideo = () => {
    setSelectedVideoId(null)
    setFormData({
      ...createEmptyVideo(),
      competicao: selectedCompetitionId ?? '',
    })
    setFeedback(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição no menu lateral.' })
      return
    }

    if (!formData.descricao || !formData.url) {
      setFeedback({ type: 'danger', message: 'Preencha a descrição e a URL do vídeo.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        descricao: formData.descricao,
        url: formData.url,
        data: normalizeDateTimeForApi(formData.data),
        ativo: Boolean(formData.ativo),
        competicao: parseNumber(selectedCompetitionId),
      }

      const response = selectedVideoId
        ? await updateVideo(selectedVideoId, payload)
        : await createVideo(payload)

      await loadVideos()

      if (selectedVideoId) {
        setSelectedVideoId(response?.id ?? selectedVideoId)
      } else {
        setSelectedVideoId(null)
        setFormData({
          ...createEmptyVideo(),
          competicao: selectedCompetitionId ?? '',
        })
      }

      setFeedback({
        type: 'success',
        message: selectedVideoId ? 'Vídeo atualizado com sucesso.' : 'Vídeo criado com sucesso.',
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o vídeo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVideo = async () => {
    if (!selectedVideoId) return

    setIsLoading(true)
    try {
      await deleteVideo(selectedVideoId)
      await loadVideos()
      setSelectedVideoId(null)
      setFormData(createEmptyVideo())
      setFeedback({ type: 'success', message: 'Vídeo removido com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o vídeo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedVideo = videos.find((item) => String(item.id) === String(selectedVideoId))
  const embedUrl = getEmbeddableVideoUrl(formData.url)

  return (
    <>
      <CRow className="g-4">
        <CCol xs={12}>
          <CCard className="mb-3">
            <CCardBody className="d-flex align-items-center gap-3">
              <CIcon icon={cilMediaPlay} size="xl" className="text-primary" />
              <div>
                <h4 className="mb-1">Vídeos</h4>
                <div className="text-medium-emphasis">
                  Cadastre e edite vídeos vinculados ao campeonato selecionado.
                </div>
                <SelectedCompetitionBadge className="mt-2" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {feedback && (
          <CCol xs={12}>
            <CAlert color={feedback.type ?? 'success'} className="mb-0">
              {feedback.message}
            </CAlert>
          </CCol>
        )}

        <CCol md={5}>
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center gap-3">
              <strong>Vídeos</strong>
              <CButton color="primary" size="sm" variant="outline" onClick={handleNewVideo}>
                <CIcon icon={cilPlus} className="me-2" /> Novo
              </CButton>
            </CCardHeader>
            <CCardBody className="p-0">
              <div className="p-3 border-bottom">
                <CRow className="g-3">
                  <CCol sm={7}>
                    <CFormLabel htmlFor="video-filter-active">Status</CFormLabel>
                    <CFormSelect
                      id="video-filter-active"
                      name="ativo"
                      value={filters.ativo}
                      onChange={handleFilterChange}
                      disabled={isLoading}
                    >
                      <option value="">Todos</option>
                      <option value="true">Ativos</option>
                      <option value="false">Inativos</option>
                    </CFormSelect>
                  </CCol>
                  <CCol sm={5} className="d-flex align-items-end">
                    <CButton
                      color="secondary"
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setFilters({ ativo: '' })
                        setSelectedVideoId(null)
                      }}
                      disabled={isLoading || !filters.ativo}
                    >
                      <CIcon icon={cilReload} className="me-2" />
                      Limpar
                    </CButton>
                  </CCol>
                </CRow>
              </div>
              {isLoading ? (
                <div className="p-3">
                  <CSpinner size="sm" className="me-2" /> Carregando vídeos...
                </div>
              ) : videos.length === 0 ? (
                <div className="p-3 text-medium-emphasis">
                  Nenhum vídeo cadastrado para esta competição.
                </div>
              ) : (
                <ListPagination items={videos} summaryLabel="vídeos">
                  {(paginatedVideos) => (
                    <CListGroup flush>
                      {paginatedVideos.map((video) => {
                        const isSelected = String(video.id) === String(selectedVideoId)

                        return (
                          <CListGroupItem
                            key={video.id}
                            action
                            active={isSelected}
                            onClick={() => handleVideoSelect(video.id)}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <div className="me-2">
                                <div className="fw-semibold">{video.descricao}</div>
                                <small className={isSelected ? 'text-white' : 'text-dark'}>
                                  Publicado em {formatVideoDate(video.data)}
                                </small>
                              </div>
                              <CBadge color={video.ativo ? 'success' : 'secondary'}>
                                {video.ativo ? 'Ativo' : 'Inativo'}
                              </CBadge>
                            </div>
                          </CListGroupItem>
                        )
                      })}
                    </CListGroup>
                  )}
                </ListPagination>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={7}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>{selectedVideoId ? 'Editar vídeo' : 'Novo vídeo'}</strong>
              {selectedVideo && (
                <div className="small text-medium-emphasis">ID do vídeo: {selectedVideo.id}</div>
              )}
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <CFormLabel htmlFor="video-description">Descrição</CFormLabel>
                  <CFormTextarea
                    id="video-description"
                    name="descricao"
                    rows={3}
                    placeholder="Ex.: Melhores momentos da rodada"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <CFormLabel htmlFor="video-url">URL do vídeo</CFormLabel>
                  <CFormInput
                    id="video-url"
                    name="url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.url}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <CRow className="g-3">
                  <CCol md={7}>
                    <CFormLabel htmlFor="video-date">Data</CFormLabel>
                    <CFormInput
                      id="video-date"
                      name="data"
                      type="datetime-local"
                      value={formData.data}
                      onChange={handleInputChange}
                    />
                  </CCol>
                  <CCol md={5}>
                    <CFormLabel htmlFor="video-status">Status</CFormLabel>
                    <CFormSelect
                      id="video-status"
                      name="ativo"
                      value={String(formData.ativo)}
                      onChange={handleInputChange}
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </CFormSelect>
                  </CCol>
                </CRow>

                {formData.url && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                      <CFormLabel className="mb-0">Visualização</CFormLabel>
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        href={formData.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <CIcon icon={cilExternalLink} className="me-2" />
                        Abrir vídeo
                      </CButton>
                    </div>
                    {embedUrl ? (
                      <div className="ratio ratio-16x9 border rounded overflow-hidden">
                        <iframe
                          src={embedUrl}
                          title={formData.descricao || 'Visualização do vídeo'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="p-3 border rounded text-medium-emphasis">
                        Prévia incorporada disponível para links do YouTube e Vimeo.
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex flex-wrap gap-2">
                  <CButton color="primary" type="submit" disabled={isLoading}>
                    <CIcon icon={cilSave} className="me-2" />
                    {selectedVideoId ? 'Atualizar' : 'Salvar'}
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    onClick={handleNewVideo}
                    disabled={isLoading}
                  >
                    <CIcon icon={cilReload} className="me-2" /> Limpar
                  </CButton>
                  <CButton
                    color="danger"
                    variant="ghost"
                    type="button"
                    disabled={!selectedVideoId || isLoading}
                    onClick={handleDeleteVideo}
                  >
                    <CIcon icon={cilTrash} className="me-2" /> Remover
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default VideosCrud
