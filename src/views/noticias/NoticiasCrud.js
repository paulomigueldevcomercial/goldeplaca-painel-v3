import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  CFormSwitch,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { listCompeticoes } from '../../services/competicaoApi'
import {
  createNoticia,
  deleteNoticia,
  listNoticias,
  updateNoticia,
} from '../../services/noticiaApi'

const createEmptyArticle = () => ({
  id: '',
  titulo: '',
  chamada: '',
  conteudo: '',
  competicao: '',
  destaque: false,
  ativo: true,
  foto: '',
  imageFile: null,
  imageFileName: '',
  imagePreviewUrl: '',
})

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['link', 'image', 'video'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
}

const NoticiasCrud = () => {
  const [competitions, setCompetitions] = useState([])
  const [news, setNews] = useState([])
  const [selectedNewsId, setSelectedNewsId] = useState(null)
  const [formData, setFormData] = useState(createEmptyArticle())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const quillContainerRef = useRef(null)
  const quillInstanceRef = useRef(null)

  const parseNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const selectedCompetition = useMemo(
    () =>
      competitions.find((competition) => String(competition.id) === String(selectedCompetitionId)),
    [competitions, selectedCompetitionId],
  )

  useEffect(() => {
    setSelectedNewsId(null)
    setFormData(createEmptyArticle())
    setFeedback(null)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedNewsId) return

    const article = news.find((item) => String(item.id) === String(selectedNewsId))
    if (!article) return
    setFormData({
      ...createEmptyArticle(),
      ...article,
      competicao: article.competicao ?? selectedCompetitionId ?? '',
      destaque: Boolean(article.destaque),
      ativo: article.ativo ?? true,
      imageFile: null,
      imageFileName: '',
      imagePreviewUrl: article.foto ?? '',
    })
  }, [news, selectedNewsId, selectedCompetitionId])

  useEffect(() => {
    if (selectedNewsId) return
    setFormData((previous) => ({
      ...previous,
      competicao: selectedCompetitionId ?? '',
    }))
  }, [selectedCompetitionId, selectedNewsId])

  useEffect(() => {
    listCompeticoes()
      .then((data) => {
        setCompetitions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setCompetitions([])
      })
  }, [])

  const loadNews = useCallback(async () => {
    if (!selectedCompetitionId) {
      setNews([])
      return
    }

    setIsLoading(true)
    try {
      const data = await listNoticias({ competicaoId: selectedCompetitionId })
      setNews(Array.isArray(data) ? data : [])
    } catch (error) {
      setNews([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as notícias.' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompetitionId])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  const handleNewsSelect = (newsId) => {
    setSelectedNewsId(newsId)
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === 'ativo' ? value === 'true' : value,
    }))
  }

  useEffect(() => {
    if (quillInstanceRef.current || !quillContainerRef.current) return

    quillInstanceRef.current = new Quill(quillContainerRef.current, {
      theme: 'snow',
      placeholder: 'Texto completo da notícia',
      modules: quillModules,
    })
  }, [])

  useEffect(() => {
    const quill = quillInstanceRef.current
    if (!quill) return

    const handleTextChange = () => {
      setFormData((previous) => ({
        ...previous,
        conteudo: quill.root.innerHTML,
      }))
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quill.off('text-change', handleTextChange)
    }
  }, [])

  useEffect(() => {
    const quill = quillInstanceRef.current
    if (!quill) return

    const nextContent = formData.conteudo || ''
    if (quill.root.innerHTML === nextContent) return

    const selection = quill.getSelection()
    quill.root.innerHTML = nextContent
    if (selection) {
      quill.setSelection(selection)
    }
  }, [formData.conteudo])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição no menu lateral.' })
      return
    }

    if (!formData.titulo || !formData.chamada) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios da notícia.' })
      return
    }

    if (!selectedNewsId && !formData.imageFile) {
      setFeedback({ type: 'danger', message: 'Selecione uma imagem para criar a notícia.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        id: selectedNewsId ?? undefined,
        titulo: formData.titulo,
        chamada: formData.chamada,
        conteudo: formData.conteudo,
        competicao: parseNumber(selectedCompetitionId),
        destaque: Boolean(formData.destaque),
        ativo: Boolean(formData.ativo),
        foto: formData.foto || undefined,
      }

      let response = null
      if (selectedNewsId) {
        response = await updateNoticia(selectedNewsId, payload, formData.imageFile)
      } else {
        response = await createNoticia(payload, formData.imageFile)
      }

      await loadNews()
      const nextId = response?.id ?? selectedNewsId ?? null
      setSelectedNewsId(nextId)
      if (!nextId) {
        setFormData(createEmptyArticle())
      }
      setFeedback({
        type: 'success',
        message: selectedNewsId ? 'Notícia atualizada com sucesso.' : 'Notícia criada com sucesso.',
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar a notícia.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNews = async () => {
    if (!selectedNewsId) return

    setIsLoading(true)
    try {
      await deleteNoticia(selectedNewsId)
      await loadNews()
      setSelectedNewsId(null)
      setFormData(createEmptyArticle())
      setFeedback({ type: 'success', message: 'Notícia removida com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a notícia.' })
    } finally {
      setIsLoading(false)
    }
  }

  const articles = news ?? []
  const handleNewsFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      imagePreviewUrl: objectUrl,
      imageFile: file,
      imageFileName: file.name,
    }))
  }

  return (
    <CRow className="g-4">
      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader>
            <strong>Competição selecionada</strong>
          </CCardHeader>
          <CCardBody>
            {selectedCompetition ? (
              <>
                <div className="fw-semibold">
                  {selectedCompetition.nomeCompeticao ||
                    selectedCompetition.descricao ||
                    selectedCompetition.id}
                </div>
                <small className="text-medium-emphasis">
                  {selectedCompetition.temporada
                    ? `Temporada ${selectedCompetition.temporada}`
                    : 'Sem temporada definida'}
                </small>
              </>
            ) : (
              <div className="text-medium-emphasis">
                Não encontrei essa competição nos dados carregados.
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={8}>
        {feedback && (
          <CAlert color={feedback.type ?? 'success'} className="mb-3">
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
                    {selectedCompetition
                      ? selectedCompetition.nomeCompeticao || selectedCompetition.descricao
                      : 'Selecione uma competição'}
                  </div>
                </div>
                <CButton
                  color="primary"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedNewsId(null)
                    setFormData(createEmptyArticle())
                    setFeedback(null)
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" /> Nova
                </CButton>
              </CCardHeader>
              <CCardBody className="p-0">
                {isLoading ? (
                  <div className="p-3">
                    <CSpinner size="sm" className="me-2" /> Carregando notícias...
                  </div>
                ) : articles.length === 0 ? (
                  <div className="p-3 text-medium-emphasis">
                    Nenhuma notícia cadastrada para esta competição.
                  </div>
                ) : (
                  <CListGroup flush>
                    {articles.map((article) => (
                      <CListGroupItem
                        key={article.id}
                        action
                        active={String(article.id) === String(selectedNewsId)}
                        onClick={() => handleNewsSelect(article.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="me-2">
                            <div className="fw-semibold">{article.titulo}</div>
                            <small className="text-medium-emphasis">
                              Publicada em {article.data}
                            </small>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            {article.destaque && (
                              <CBadge color="info" shape="rounded-pill">
                                Destaque
                              </CBadge>
                            )}
                            <CBadge color={article.ativo ? 'success' : 'secondary'}>
                              {article.ativo ? 'Ativa' : 'Inativa'}
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
                  A notícia será enviada para a API oficial, incluindo a imagem enviada.
                </div>
              </CCardHeader>
              <CCardBody>
                <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <CFormLabel htmlFor="news-title">Título</CFormLabel>
                    <CFormInput
                      id="news-title"
                      name="titulo"
                      placeholder="Ex.: Equipe garante vitória na estreia"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-summary">Resumo</CFormLabel>
                    <CFormTextarea
                      id="news-summary"
                      name="chamada"
                      rows={2}
                      placeholder="Resumo curto exibido na lista"
                      value={formData.chamada}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-content">Conteúdo</CFormLabel>
                    <div id="news-content" ref={quillContainerRef} />
                  </div>

                  <div>
                    <CFormLabel htmlFor="news-image-upload">Upload de imagem da notícia</CFormLabel>
                    <CFormInput
                      id="news-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleNewsFileChange}
                      required={!selectedNewsId}
                    />
                    {formData.imageFileName && (
                      <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                    )}
                    {formData.imagePreviewUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imagePreviewUrl}
                          alt="Prévia da notícia"
                          className="img-fluid rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-3 align-items-center">
                    <CFormSwitch
                      id="news-highlight"
                      label="Destacar notícia"
                      checked={formData.destaque}
                      onChange={({ target }) => {
                        setFormData((previous) => ({
                          ...previous,
                          destaque: target.checked,
                        }))
                      }}
                    />
                    <div className="text-medium-emphasis small">
                      Aparece com selo de destaque na lista.
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol sm={6}>
                      <CFormLabel htmlFor="news-status">Status ativo</CFormLabel>
                      <CFormSelect
                        id="news-status"
                        name="ativo"
                        value={String(formData.ativo)}
                        onChange={handleInputChange}
                      >
                        <option value="true">Ativa</option>
                        <option value="false">Inativa</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  <div className="d-flex flex-wrap gap-2">
                    <CButton color="primary" type="submit">
                      <CIcon icon={cilSave} className="me-2" /> Salvar
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedNewsId(null)
                        setFormData(createEmptyArticle())
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
