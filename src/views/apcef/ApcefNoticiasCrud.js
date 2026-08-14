import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { cilNotes, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import ListPagination from '../../components/ListPagination'
import { getApcefPublicBaseUrl } from '../../config/runtimeConfig'
import {
  createApcefNoticia,
  deleteApcefNoticia,
  deleteApcefNoticiaImagem,
  listApcefCategorias,
  listApcefNoticias,
  updateApcefNoticia,
} from '../../services/apcefApi'

const createEmptyArticle = () => ({
  id: '',
  titulo: '',
  noticia: '',
  categoria: '',
  imagens: [],
  imageFiles: [],
  imageFileNames: [],
})

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ header: [1, 2, 3, false] }],
    ['link', 'image'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
}

const formatPublishedAt = (value) => {
  if (!value) return '-'

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (match) {
    const [, year, month, day, hour = '00', minute = '00'] = match
    return `${day}/${month}/${year} as ${hour}:${minute}`
  }

  return value
}

const getGalleryImageUrl = (src) => {
  if (!src) return ''
  const fileName = String(src).split('/').filter(Boolean).pop()
  return fileName ? `${getApcefPublicBaseUrl()}/images/gallery/${fileName}` : ''
}

const ApcefNoticiasCrud = () => {
  const [articles, setArticles] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filters, setFilters] = useState({ categoria: '' })
  const [selectedNewsId, setSelectedNewsId] = useState(null)
  const [formData, setFormData] = useState(createEmptyArticle())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const quillContainerRef = useRef(null)
  const quillInstanceRef = useRef(null)

  const categoriasById = useMemo(
    () => new Map(categorias.map((categoria) => [String(categoria.id), categoria.categoria])),
    [categorias],
  )

  useEffect(() => {
    listApcefCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]))
  }, [])

  const loadArticles = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listApcefNoticias({ categoria: filters.categoria || undefined })
      setArticles(Array.isArray(data) ? data : [])
    } catch (error) {
      setArticles([])
      setFeedback({ type: 'danger', message: 'Nao foi possivel carregar as noticias APCEF.' })
    } finally {
      setIsLoading(false)
    }
  }, [filters.categoria])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadArticles()
  }, [loadArticles])

  useEffect(() => {
    if (quillInstanceRef.current || !quillContainerRef.current) return

    quillInstanceRef.current = new Quill(quillContainerRef.current, {
      theme: 'snow',
      placeholder: 'Texto completo da noticia',
      modules: quillModules,
    })
  }, [])

  useEffect(() => {
    const quill = quillInstanceRef.current
    if (!quill) return

    const handleTextChange = () => {
      setFormData((previous) => ({
        ...previous,
        noticia: quill.root.innerHTML,
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

    const nextContent = formData.noticia || ''
    if (quill.root.innerHTML === nextContent) return

    const selection = quill.getSelection()
    quill.root.innerHTML = nextContent
    if (selection) {
      quill.setSelection(selection)
    }
  }, [formData.noticia])

  useEffect(() => {
    if (!selectedNewsId) return

    const article = articles.find((item) => String(item.id) === String(selectedNewsId))
    if (!article) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      ...createEmptyArticle(),
      ...article,
      categoria: article.categoria ?? '',
      imagens: article.imagens ?? [],
    })
    setFileInputKey((previous) => previous + 1)
  }, [articles, selectedNewsId])

  const resetForm = () => {
    setSelectedNewsId(null)
    setFormData(createEmptyArticle())
    setFeedback(null)
    setFileInputKey((previous) => previous + 1)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleFilterChange = ({ target }) => {
    setFilters({ categoria: target.value })
    setSelectedNewsId(null)
  }

  const handleFileChange = ({ target }) => {
    const files = Array.from(target.files ?? [])
    setFormData((previous) => ({
      ...previous,
      imageFiles: files,
      imageFileNames: files.map((file) => file.name),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!formData.titulo || !formData.categoria || !formData.noticia) {
      setFeedback({ type: 'danger', message: 'Preencha titulo, categoria e conteudo.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        titulo: formData.titulo,
        noticia: formData.noticia,
        categoria: formData.categoria,
      }

      const response = selectedNewsId
        ? await updateApcefNoticia(selectedNewsId, payload, formData.imageFiles)
        : await createApcefNoticia(payload, formData.imageFiles)

      await loadArticles()
      setSelectedNewsId(response?.id ?? null)
      setFeedback({
        type: 'success',
        message: selectedNewsId
          ? 'Noticia APCEF atualizada com sucesso.'
          : 'Noticia APCEF criada com sucesso.',
      })
      setFormData((previous) => ({
        ...previous,
        imageFiles: [],
        imageFileNames: [],
      }))
      setFileInputKey((previous) => previous + 1)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Nao foi possivel salvar a noticia.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNews = async () => {
    if (!selectedNewsId) return

    setIsLoading(true)
    try {
      await deleteApcefNoticia(selectedNewsId)
      await loadArticles()
      resetForm()
      setFeedback({ type: 'success', message: 'Noticia APCEF removida com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Nao foi possivel remover a noticia.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!imageId) return

    setIsLoading(true)
    try {
      await deleteApcefNoticiaImagem(imageId)
      await loadArticles()
      setFeedback({ type: 'success', message: 'Imagem removida com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Nao foi possivel remover a imagem.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilNotes} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Noticias APCEF</h4>
              <div className="text-medium-emphasis">
                Gerencie as noticias legadas das tabelas noticias e noticias_img.
              </div>
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
            <strong>Noticias</strong>
            <CButton color="primary" size="sm" variant="outline" onClick={resetForm}>
              <CIcon icon={cilPlus} className="me-2" /> Nova
            </CButton>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormLabel htmlFor="apcef-news-filter-category">Categoria</CFormLabel>
              <CFormSelect
                id="apcef-news-filter-category"
                value={filters.categoria}
                onChange={handleFilterChange}
                disabled={isLoading}
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.categoria}
                  </option>
                ))}
              </CFormSelect>
            </div>

            {isLoading ? (
              <div className="p-3">
                <CSpinner size="sm" className="me-2" /> Carregando noticias...
              </div>
            ) : articles.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma noticia encontrada.</div>
            ) : (
              <ListPagination items={articles} summaryLabel="noticias">
                {(paginatedArticles) => (
                  <CListGroup flush>
                    {paginatedArticles.map((article) => {
                      const isSelected = String(article.id) === String(selectedNewsId)
                      const categoriaNome =
                        article.categoriaNome ?? categoriasById.get(String(article.categoria))

                      return (
                        <CListGroupItem
                          key={article.id}
                          action
                          active={isSelected}
                          onClick={() => {
                            setSelectedNewsId(article.id)
                            setFeedback(null)
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-semibold">{article.titulo}</div>
                              <small className={isSelected ? 'text-white' : 'text-dark'}>
                                Publicada em {formatPublishedAt(article.data)}
                              </small>
                            </div>
                            {categoriaNome && (
                              <CBadge color={isSelected ? 'light' : 'secondary'}>
                                {categoriaNome}
                              </CBadge>
                            )}
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
            <strong>{selectedNewsId ? 'Editar noticia APCEF' : 'Nova noticia APCEF'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="apcef-news-title">Titulo</CFormLabel>
                <CFormInput
                  id="apcef-news-title"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                />
              </div>

              <CRow className="g-3">
                <CCol sm={12}>
                  <CFormLabel htmlFor="apcef-news-category">Categoria</CFormLabel>
                  <CFormSelect
                    id="apcef-news-category"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.categoria}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="apcef-news-content">Conteudo</CFormLabel>
                <div id="apcef-news-content" ref={quillContainerRef} />
              </div>

              <div>
                <CFormLabel htmlFor="apcef-news-images">Imagens da noticia</CFormLabel>
                <CFormInput
                  key={fileInputKey}
                  id="apcef-news-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                {formData.imageFileNames.length > 0 && (
                  <div className="form-text">
                    Arquivos selecionados: {formData.imageFileNames.join(', ')}
                  </div>
                )}
              </div>

              {formData.imagens?.length > 0 && (
                <div className="d-flex flex-wrap gap-3">
                  {formData.imagens.map((imagem) => (
                    <div key={imagem.id} className="border rounded p-2" style={{ width: 140 }}>
                      <img
                        src={getGalleryImageUrl(imagem.src)}
                        alt="Noticia APCEF"
                        className="img-fluid mb-2"
                      />
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleDeleteImage(imagem.id)}
                      >
                        Remover
                      </CButton>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />{' '}
                  {selectedNewsId ? 'Atualizar' : 'Salvar'}
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={resetForm}>
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
  )
}

export default ApcefNoticiasCrud
