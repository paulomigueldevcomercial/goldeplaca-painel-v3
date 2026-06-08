import React, { useEffect, useMemo, useState } from 'react'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import { fetchCompetitionsWithGalleries } from '../../services/competitionApi'

const initialCompetitions = []

const emptyGallery = {
  title: '',
  description: '',
  coverUrl: '',
  coverFileName: '',
  status: 'ativa',
  updatedAt: '',
}

const getCompetitionKey = (competitionId) => String(competitionId ?? '')

const GaleriaCrud = () => {
  const [competitions, setCompetitions] = useState(initialCompetitions)
  const [selectedGalleryState, setSelectedGalleryState] = useState({
    competitionId: '',
    galleryId: null,
  })
  const [formState, setFormState] = useState({
    competitionId: '',
    data: emptyGallery,
  })
  const [feedback, setFeedback] = useState(null)
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const currentCompetitionKey = getCompetitionKey(selectedCompetitionId)
  const selectedGalleryId =
    selectedGalleryState.competitionId === currentCompetitionKey
      ? selectedGalleryState.galleryId
      : null
  const formData = formState.competitionId === currentCompetitionKey ? formState.data : emptyGallery

  const setFormData = (updater) => {
    setFormState((previous) => {
      const previousData =
        previous.competitionId === currentCompetitionKey ? previous.data : emptyGallery
      const nextData = typeof updater === 'function' ? updater(previousData) : updater

      return {
        competitionId: currentCompetitionKey,
        data: nextData,
      }
    })
  }

  const selectedCompetition = useMemo(
    () =>
      competitions.find((competition) => String(competition.id) === String(selectedCompetitionId)),
    [competitions, selectedCompetitionId],
  )

  useEffect(() => {
    fetchCompetitionsWithGalleries().then((data) => {
      setCompetitions(data)
    })
  }, [])

  const handleGallerySelect = (galleryId) => {
    const gallery = selectedCompetition?.galleries.find((item) => item.id === galleryId)

    setSelectedGalleryState({
      competitionId: currentCompetitionKey,
      galleryId,
    })
    if (gallery) {
      setFormData({ ...emptyGallery, ...gallery, coverFileName: gallery.coverFileName ?? '' })
    }
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
      ...(name === 'coverUrl' ? { coverFileName: '' } : null),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selectedCompetitionId) {
      setFeedback('Selecione uma competição no menu lateral.')
      return
    }

    const galleryId = selectedGalleryId ?? `gal-${Date.now()}`
    const payload = {
      ...formData,
      id: galleryId,
      updatedAt: formData.updatedAt || new Date().toLocaleDateString('pt-BR'),
    }

    setCompetitions((previous) => {
      const targetId = String(selectedCompetitionId)
      const existing = previous.find((competition) => String(competition.id) === targetId)
      const baseCompetition = existing ?? {
        id: targetId,
        name: `Competição ${targetId}`,
        season: '',
        category: '',
        news: [],
        galleries: [],
      }
      const galleries = selectedGalleryId
        ? baseCompetition.galleries.map((gallery) =>
            gallery.id === selectedGalleryId ? payload : gallery,
          )
        : [...baseCompetition.galleries, payload]
      const nextCompetition = { ...baseCompetition, galleries }

      return existing
        ? previous.map((competition) =>
            String(competition.id) === targetId ? nextCompetition : competition,
          )
        : [...previous, nextCompetition]
    })

    setSelectedGalleryState({
      competitionId: currentCompetitionKey,
      galleryId,
    })
    setFeedback(
      selectedGalleryId
        ? 'Galeria atualizada com sucesso.'
        : 'Nova galeria criada para a competição.',
    )
  }

  const handleDeleteGallery = () => {
    if (!selectedCompetition || !selectedGalleryId) return

    setCompetitions((previous) =>
      previous.map((competition) => {
        if (competition.id !== selectedCompetition.id) return competition

        return {
          ...competition,
          galleries: competition.galleries.filter((gallery) => gallery.id !== selectedGalleryId),
        }
      }),
    )

    setSelectedGalleryState({
      competitionId: currentCompetitionKey,
      galleryId: null,
    })
    setFormData(emptyGallery)
    setFeedback('Galeria removida da competição.')
  }

  const galleries = selectedCompetition?.galleries ?? []
  const handleGalleryFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      coverUrl: objectUrl,
      coverFileName: file.name,
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
                <div className="fw-semibold">{selectedCompetition.name}</div>
                <small className="text-medium-emphasis">
                  {selectedCompetition.season} • {selectedCompetition.category}
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
          <CAlert color="success" className="mb-3">
            {feedback}
          </CAlert>
        )}
        <CRow className="g-4">
          <CCol md={5}>
            <CCard className="h-100">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Galerias</strong>
                  <div className="small text-medium-emphasis">
                    {selectedCompetition ? selectedCompetition.name : 'Selecione uma competição'}
                  </div>
                </div>
                <CButton
                  color="primary"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedGalleryState({
                      competitionId: currentCompetitionKey,
                      galleryId: null,
                    })
                    setFormData(emptyGallery)
                    setFeedback(null)
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" /> Nova
                </CButton>
              </CCardHeader>
              <CCardBody className="p-0">
                {galleries.length === 0 ? (
                  <div className="p-3 text-medium-emphasis">
                    Nenhuma galeria cadastrada para esta competição.
                  </div>
                ) : (
                  <ListPagination items={galleries} summaryLabel="galerias">
                    {(paginatedGalleries) => (
                      <CListGroup flush>
                        {paginatedGalleries.map((gallery) => (
                          <CListGroupItem
                            key={gallery.id}
                            action
                            active={gallery.id === selectedGalleryId}
                            onClick={() => handleGallerySelect(gallery.id)}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">{gallery.title}</div>
                                <small className="text-medium-emphasis">
                                  Atualizado em {gallery.updatedAt}
                                </small>
                              </div>
                              <CBadge
                                color={
                                  gallery.status === 'ativa'
                                    ? 'success'
                                    : gallery.status === 'rascunho'
                                      ? 'warning'
                                      : 'secondary'
                                }
                              >
                                {gallery.status}
                              </CBadge>
                            </div>
                          </CListGroupItem>
                        ))}
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
                <strong>{selectedGalleryId ? 'Editar galeria' : 'Nova galeria'}</strong>
                <div className="small text-medium-emphasis">
                  Os dados são salvos localmente apenas para demonstrar o fluxo do CRUD.
                </div>
              </CCardHeader>
              <CCardBody>
                <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <CFormLabel htmlFor="gallery-title">Título</CFormLabel>
                    <CFormInput
                      id="gallery-title"
                      name="title"
                      placeholder="Ex.: Rodada 3 - Melhores momentos"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="gallery-description">Descrição</CFormLabel>
                    <CFormTextarea
                      id="gallery-description"
                      name="description"
                      rows={3}
                      placeholder="Resumo curto sobre o conteúdo da galeria"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <CFormLabel htmlFor="gallery-cover-upload">Upload da imagem de capa</CFormLabel>
                    <CFormInput
                      id="gallery-cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFileChange}
                    />
                    {formData.coverFileName && (
                      <div className="form-text">Arquivo selecionado: {formData.coverFileName}</div>
                    )}
                  </div>

                  <div>
                    <CFormLabel htmlFor="gallery-cover">URL da imagem de capa</CFormLabel>
                    <CFormInput
                      id="gallery-cover"
                      name="coverUrl"
                      placeholder="https://..."
                      value={formData.coverUrl}
                      onChange={handleInputChange}
                    />
                  </div>

                  <CRow className="g-3">
                    <CCol sm={6}>
                      <CFormLabel htmlFor="gallery-status">Status</CFormLabel>
                      <CFormSelect
                        id="gallery-status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="ativa">Ativa</option>
                        <option value="rascunho">Rascunho</option>
                        <option value="arquivada">Arquivada</option>
                      </CFormSelect>
                    </CCol>
                    <CCol sm={6}>
                      <CFormLabel htmlFor="gallery-updated">Data de atualização</CFormLabel>
                      <CFormInput
                        id="gallery-updated"
                        name="updatedAt"
                        placeholder="dd/mm/aaaa"
                        value={formData.updatedAt}
                        onChange={handleInputChange}
                      />
                    </CCol>
                  </CRow>

                  <div className="d-flex flex-wrap gap-2">
                    <CButton color="primary" type="submit">
                      <CIcon icon={cilSave} className="me-2" />{' '}
                      {selectedGalleryId ? 'Atualizar' : 'Salvar'}
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedGalleryState({
                          competitionId: currentCompetitionKey,
                          galleryId: null,
                        })
                        setFormData(emptyGallery)
                        setFeedback(null)
                      }}
                    >
                      <CIcon icon={cilReload} className="me-2" /> Limpar
                    </CButton>
                    <CButton
                      color="danger"
                      variant="ghost"
                      type="button"
                      disabled={!selectedGalleryId}
                      onClick={handleDeleteGallery}
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

export default GaleriaCrud
