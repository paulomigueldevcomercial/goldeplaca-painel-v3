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
  CFormSwitch,
  CListGroup,
  CListGroupItem,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import { fetchCompetitionsWithNews } from '../../services/competitionApi'

const initialCompetitions = []

const emptyArticle = {
  title: '',
  summary: '',
  content: '',
  status: 'publicada',
  publishedAt: '',
  author: '',
  highlight: false,
}

const statusColorMap = {
  publicada: 'success',
  rascunho: 'warning',
  arquivada: 'secondary',
}

const NoticiasCrud = () => {
  const [competitions, setCompetitions] = useState(initialCompetitions)
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(
    initialCompetitions[0]?.id ?? null,
  )
  const [selectedNewsId, setSelectedNewsId] = useState(null)
  const [formData, setFormData] = useState(emptyArticle)
  const [feedback, setFeedback] = useState(null)

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
    setSelectedNewsId(null)
    setFormData(emptyArticle)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedNewsId) {
      setFormData(emptyArticle)
      return
    }

    const article = selectedCompetition?.news.find((item) => item.id === selectedNewsId)
    if (article) {
      setFormData({ ...article })
    }
  }, [selectedCompetition, selectedNewsId])

  useEffect(() => {
    fetchCompetitionsWithNews().then((data) => {
      setCompetitions(data)

      if (!selectedCompetitionId && data.length) {
        setSelectedCompetitionId(data[0].id)
      }
    })
  }, [])

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
    }))
  }

  const handleHighlightChange = ({ target }) => {
    setFormData((previous) => ({
      ...previous,
      highlight: target.checked,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selectedCompetition) return

    const newsId = selectedNewsId ?? `news-${Date.now()}`
    const payload = {
      ...formData,
      id: newsId,
      highlight: Boolean(formData.highlight),
      publishedAt: formData.publishedAt || new Date().toLocaleDateString('pt-BR'),
    }

    setCompetitions((previous) =>
      previous.map((competition) => {
        if (competition.id !== selectedCompetition.id) return competition

        const news = selectedNewsId
          ? competition.news.map((article) => (article.id === selectedNewsId ? payload : article))
          : [...competition.news, payload]

        return { ...competition, news }
      }),
    )

    setSelectedNewsId(newsId)
    setFeedback(
      selectedNewsId ? 'Notícia atualizada com sucesso.' : 'Nova notícia criada para a competição.',
    )
  }

  const handleDeleteNews = () => {
    if (!selectedCompetition || !selectedNewsId) return

    setCompetitions((previous) =>
      previous.map((competition) => {
        if (competition.id !== selectedCompetition.id) return competition

        return {
          ...competition,
          news: competition.news.filter((article) => article.id !== selectedNewsId),
        }
      }),
    )

    setSelectedNewsId(null)
    setFormData(emptyArticle)
    setFeedback('Notícia removida da competição.')
  }

  const articles = selectedCompetition?.news ?? []

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
                  <CBadge color="primary" shape="rounded-pill">
                    {competition.news.length}
                  </CBadge>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={8}>
        {feedback && (
          <CAlert color="success" className="mb-3">
            {feedback}
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
                  Os dados são salvos localmente apenas para demonstrar o fluxo do CRUD.
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
                    <CFormTextarea
                      id="news-content"
                      name="content"
                      rows={4}
                      placeholder="Texto completo da notícia"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                    />
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
                    <CButton color="primary" type="submit">
                      <CIcon icon={cilSave} className="me-2" /> Salvar
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      type="button"
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
                      disabled={!selectedNewsId}
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
