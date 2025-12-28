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
  CListGroup,
  CListGroupItem,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
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

const GaleriaCrud = () => {
  const [competitions, setCompetitions] = useState(initialCompetitions)
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(initialCompetitions[0]?.id ?? null)
  const [selectedGalleryId, setSelectedGalleryId] = useState(null)
  const [formData, setFormData] = useState(emptyGallery)
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
    setSelectedGalleryId(null)
    setFormData(emptyGallery)
  }, [selectedCompetitionId])

  useEffect(() => {
    if (!selectedGalleryId) {
      setFormData(emptyGallery)
      return
    }

    const gallery = selectedCompetition?.galleries.find((item) => item.id === selectedGalleryId)
    if (gallery) {
      setFormData({ ...emptyGallery, ...gallery, coverFileName: gallery.coverFileName ?? '' })
    }
  }, [selectedCompetition, selectedGalleryId])

  useEffect(() => {
    fetchCompetitionsWithGalleries().then((data) => {
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

  const handleGallerySelect = (galleryId) => {
    setSelectedGalleryId(galleryId)
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

    if (!selectedCompetition) return

    const galleryId = selectedGalleryId ?? `gal-${Date.now()}`
    const payload = {
      ...formData,
      id: galleryId,
      updatedAt: formData.updatedAt || new Date().toLocaleDateString('pt-BR'),
    }

    setCompetitions((previous) =>
      previous.map((competition) => {
        if (competition.id !== selectedCompetition.id) return competition

        const galleries = selectedGalleryId
          ? competition.galleries.map((gallery) => (gallery.id === selectedGalleryId ? payload : gallery))
          : [...competition.galleries, payload]

        return { ...competition, galleries }
      }),
    )

    setSelectedGalleryId(galleryId)
    setFeedback(selectedGalleryId ? 'Galeria atualizada com sucesso.' : 'Nova galeria criada para a competição.')
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

    setSelectedGalleryId(null)
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
                    setSelectedGalleryId(null)
                    setFormData(emptyGallery)
                    setFeedback(null)
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" /> Nova
                </CButton>
              </CCardHeader>
              <CCardBody className="p-0">
                {galleries.length === 0 ? (
                  <div className="p-3 text-medium-emphasis">Nenhuma galeria cadastrada para esta competição.</div>
                ) : (
                  <CListGroup flush>
                    {galleries.map((gallery) => (
                      <CListGroupItem
                        key={gallery.id}
                        action
                        active={gallery.id === selectedGalleryId}
                        onClick={() => handleGallerySelect(gallery.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold">{gallery.title}</div>
                            <small className="text-medium-emphasis">Atualizado em {gallery.updatedAt}</small>
                          </div>
                          <CBadge color={gallery.status === 'ativa' ? 'success' : gallery.status === 'rascunho' ? 'warning' : 'secondary'}>
                            {gallery.status}
                          </CBadge>
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
                      <CIcon icon={cilSave} className="me-2" /> Salvar
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedGalleryId(null)
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
