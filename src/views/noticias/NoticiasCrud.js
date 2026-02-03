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
  CFormTextarea,
  CFormSwitch,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import { useQuill } from 'react-quilljs'
import 'quill/dist/quill.snow.css'
import { listCompeticoes } from '../../services/competicaoApi'
import { createNoticia, deleteNoticia, listNoticias, updateNoticia } from '../../services/noticiaApi'

const emptyArticle = {
  title: '',
  summary: '',
  content: '',
  status: 'publicada',
  publishedAt: '',
  author: '',
  imageUrl: '',
  imageFileName: '',
  imageFile: null,
  highlight: false,
}

const statusColorMap = {
  publicada: 'success',
  rascunho: 'warning',
  arquivada: 'secondary',
}

const parseDateToIso = (value) => {
  if (!value) return new Date().toISOString()
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) {
    return new Date(direct).toISOString()
  }

  const [day, month, year] = value.split('/')
  if (day && month && year) {
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return new Date().toISOString()
}

const toPtBrDate = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('pt-BR')
}

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const mapCompetition = (competition) => ({
  id: competition.id,
  name: competition.nomeCompeticao ?? competition.descricao ?? 'Competição',
  season: competition.temporada ?? '',
  category: competition.abrev ?? '',
})

const mapNoticiaToArticle = (noticia) => ({
  id: noticia.id,
  title: noticia.titulo ?? '',
  summary: noticia.chamada ?? '',
  content: noticia.conteudo ?? '',
  status: noticia.ativo ? 'publicada' : 'rascunho',
  publishedAt: toPtBrDate(noticia.data),
  author: '',
  imageUrl: noticia.foto ?? '',
  imageFileName: '',
  imageFile: null,
  highlight: Boolean(noticia.destaque),
})

const NoticiasCrud = () => {
  const [competitions, setCompetitions] = useState([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null)
  const [selectedNewsId, setSelectedNewsId] = useState(null)
  const [formData, setFormData] = useState(emptyArticle)
  const [news, setNews] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === selectedCompetitionId),
    [competitions, selectedCompetitionId],
  )

  useEffect(() => {
    if (!selectedCompetitionId && competitions.length) {
      setSelectedCompetitionId(competitions[0].id)
    }
  }, [competitions, selectedCompetitionId])

  useEffect(() => {
    if (!selectedNewsId) {
      setFormData(emptyArticle)
      return
    }

    const article = news.find((item) => String(item.id) === String(selectedNewsId))
    if (article) {
      setFormData({
        ...emptyArticle,
        ...article,
        imageFileName: article.imageFileName ?? '',
        imageFile: null,
      })
    }
  }, [news, selectedNewsId])

  const loadCompetitions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listCompeticoes()
      const mapped = Array.isArray(data) ? data.map(mapCompetition) : []
      setCompetitions(mapped)
      if (!selectedCompetitionId && mapped.length) {
        setSelectedCompetitionId(mapped[0].id)
      }
    } catch (error) {
      setCompetitions([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as competições.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId])

  const loadNews = useCallback(
    async (competitionId) => {
      if (!competitionId) {
        setNews([])
        return
      }

      setIsLoading(true)
      try {
        const data = await listNoticias(competitionId)
        const mapped = Array.isArray(data) ? data.map(mapNoticiaToArticle) : []
        setNews(mapped)
      } catch (error) {
        setNews([])
        setFeedback({ type: 'danger', message: 'Não foi possível carregar as notícias.' })
      } finally {
        setIsLoading(false)
      }
    },
    [setNews],
  )

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  useEffect(() => {
    setSelectedNewsId(null)
    setFormData(emptyArticle)
    loadNews(selectedCompetitionId)
  }, [selectedCompetitionId, loadNews])

  const handleCompetitionChange = (competitionId) => {
    setSelectedCompetitionId(competitionId)
    setFeedback(null)
  }

  const handleNewsSelect = (newsId) => {
    setSelectedNewsId(newsId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
      ...(name === 'imageUrl' ? { imageFileName: '' } : null),
    }))
  }

  const handleHighlightChange = ({ target }) => {
    setFormData((previous) => ({
      ...previous,
      highlight: target.checked,
    }))
  }

  const { quill, quillRef } = useQuill({
    theme: 'snow',
    placeholder: 'Texto completo da notícia',
  })

  useEffect(() => {
    if (!quill) return

    const handleTextChange = () => {
      setFormData((previous) => ({
        ...previous,
        content: quill.root.innerHTML,
      }))
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quill.off('text-change', handleTextChange)
    }
  }, [quill])

  useEffect(() => {
    if (!quill) return

    const nextContent = formData.content || ''
    if (quill.root.innerHTML === nextContent) return

    const selection = quill.getSelection()
    quill.root.innerHTML = nextContent
    if (selection) {
      quill.setSelection(selection)
    }
  }, [formData.content, quill])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCompetition) return

    if (!formData.imageFile) {
      setFeedback({
        type: 'danger',
        message: 'Selecione uma imagem para enviar junto da notícia.',
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        id: selectedNewsId ? parseNumber(selectedNewsId) : undefined,
        titulo: formData.title,
        conteudo: formData.content,
        data: parseDateToIso(formData.publishedAt),
        competicao: parseNumber(selectedCompetitionId),
        destaque: Boolean(formData.highlight),
        chamada: formData.summary,
        ativo: formData.status === 'publicada',
        foto: formData.imageUrl || undefined,
      }

      if (selectedNewsId) {
        await updateNoticia(selectedNewsId, payload, formData.imageFile)
        setFeedback({ type: 'success', message: 'Notícia atualizada com sucesso.' })
      } else {
        const created = await createNoticia(payload, formData.imageFile)
        setSelectedNewsId(created?.id ?? null)
        setFeedback({ type: 'success', message: 'Nova notícia criada para a competição.' })
      }

      await loadNews(selectedCompetitionId)
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar a notícia.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNews = async () => {
    if (!selectedCompetition || !selectedNewsId) return

    setIsLoading(true)
    try {
      await deleteNoticia(selectedNewsId)
      setSelectedNewsId(null)
      setFormData(emptyArticle)
      setFeedback({ type: 'success', message: 'Notícia removida da competição.' })
      await loadNews(selectedCompetitionId)
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a notícia.' })
    } finally {
      setIsLoading(false)
    }
  }

  const articles = news
  const handleNewsFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      imageUrl: objectUrl,
      imageFileName: file.name,
      imageFile: file,
    }))
  }

  return (
    <CRow className="g-4">
      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader>
            <strong>Competições</strong>
          </CCardHeader>
          <CCardBody className="p-0">
            <CListGroup flush>
              {competitions.map((competition) => (
                <CListGroupItem
                  key={competition.id}
                  component="button"
                  onClick={() => handleCompetitionChange(competition.id)}
                  active={competition.id === selectedCompetitionId}
                  className="text-start d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div className="fw-semibold">{competition.name}</div>
                    <small className="text-medium-emphasis">
                      {competition.season} • {competition.category}
                    </small>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={8}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}
        <CRow className="g-4">
          <CCol md={5}>
            <CCard className="h-100">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Notícias</strong>
                  <div className="small text-medium-emphasis">
                    {selectedCompetition ? selectedCompetition.name : 'Selecione uma competição'}
                  </div>
                </div>
                {isLoading && <CSpinner size="sm" color="primary" />}
                <CButton
                  color="primary"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedNewsId(null)
                    setFormData(emptyArticle)
                    setFeedback(null)
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" /> Nova
                </CButton>
              </CCardHeader>
              <CCardBody className="p-0">
                {articles.length === 0 ? (
                  <div className="p-3 text-medium-emphasis">
                    Nenhuma notícia cadastrada para esta competição.
                  </div>
                ) : (
                  <CListGroup flush>
                    {articles.map((article) => (
                      <CListGroupItem
                        key={article.id}
                        action
                        active={article.id === selectedNewsId}
                        onClick={() => handleNewsSelect(article.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="me-2">
                            <div className="fw-semibold">{article.title}</div>
                            <small className="text-medium-emphasis">
                              Publicada em {article.publishedAt}
                            </small>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            {article.highlight && (
                              <CBadge color="info" shape="rounded-pill">
                                Destaque
                              </CBadge>
                            )}
                            <CBadge color={statusColorMap[article.status] ?? 'secondary'}>
                              {article.status}
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

          <CCol md={7}>
            <CCard className="h-100">
              <CCardHeader>
                <strong>{selectedNewsId ? 'Editar notícia' : 'Nova notícia'}</strong>
                <div className="small text-medium-emphasis">
                  Os dados são enviados para a API de notícias.
                </div>
              </CCardHeader>
              <CCardBody>
                <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <CFormLabel htmlFor="news-title">Título</CFormLabel>
                    <CFormInput
                      id="news-title"
                      name="title"
                      placeholder="Ex.: Equipe garante vitória na estreia"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-summary">Resumo</CFormLabel>
                    <CFormTextarea
                      id="news-summary"
                      name="summary"
                      rows={2}
                      placeholder="Resumo curto exibido na lista"
                      value={formData.summary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-content">Conteúdo</CFormLabel>
                    <div id="news-content" ref={quillRef} />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-image-upload">Upload de imagem da notícia</CFormLabel>
                    <CFormInput
                      id="news-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleNewsFileChange}
                      required
                    />
                    {formData.imageFileName && (
                      <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                    )}
                    {!formData.imageFileName && formData.imageUrl && (
                      <div className="form-text">Imagem atual registrada na API.</div>
                    )}
                  </div>

                  <div className="d-flex gap-3 align-items-center">
                    <CFormSwitch
                      id="news-highlight"
                      label="Destacar notícia"
                      checked={formData.highlight}
                      onChange={handleHighlightChange}
                    />
                    <div className="text-medium-emphasis small">
                      Aparece com selo de destaque na lista.
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol sm={6}>
                      <CFormLabel htmlFor="news-status">Status</CFormLabel>
                      <CFormSelect
                        id="news-status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="publicada">Publicada</option>
                        <option value="rascunho">Rascunho</option>
                        <option value="arquivada">Arquivada</option>
                      </CFormSelect>
                    </CCol>
                    <CCol sm={6}>
                      <CFormLabel htmlFor="news-published">Data de publicação</CFormLabel>
                      <CFormInput
                        id="news-published"
                        name="publishedAt"
                        placeholder="dd/mm/aaaa"
                        value={formData.publishedAt}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <div>
                    <CFormLabel htmlFor="news-author">Autor / Fonte</CFormLabel>
                    <CFormInput
                      id="news-author"
                      name="author"
                      placeholder="Responsável pela notícia"
                      value={formData.author}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <CButton color="primary" type="submit" disabled={isLoading}>
                      <CIcon icon={cilSave} className="me-2" /> Salvar
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setSelectedNewsId(null)
                        setFormData(emptyArticle)
                        setFeedback(null)
                      }}
                    >
                      <CIcon icon={cilReload} className="me-2" /> Limpar
                    </CButton>
                    <CButton
                      color="danger"
                      variant="ghost"
                      type="button"
                      disabled={!selectedNewsId || isLoading}
                      onClick={handleDeleteNews}
                    >
                      <CIcon icon={cilTrash} className="me-2" /> Remover
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CCol>
    </CRow>
  )
}

export default NoticiasCrud
