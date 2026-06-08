import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilNotes, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import {
  createPatrocinio,
  deletePatrocinio,
  listPatrocinios,
  updatePatrocinio,
} from '../../services/patrocinioApi'

const createEmptySponsor = () => ({
  id: '',
  descricao: '',
  imagem: '',
  imageFile: null,
  imageFileName: '',
  imagePreviewUrl: '',
})

const SPONSOR_IMAGE_BASE_PATH = '/images/patrocinios'

const getSponsorImageUrl = (imagem) => {
  if (!imagem) return ''

  const normalizedPath = String(imagem).trim()
  if (!normalizedPath || normalizedPath.startsWith('data:') || normalizedPath.startsWith('blob:')) {
    return normalizedPath
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    try {
      const url = new URL(normalizedPath)
      return url.pathname.replace('/painel/images/', '/images/')
    } catch (error) {
      return normalizedPath.replace('/painel/images/', '/images/')
    }
  }

  const relativePath = normalizedPath.replace(/^\/+/, '').replace(/^painel\/images\//, 'images/')
  if (relativePath.startsWith('images/')) return `/${relativePath}`

  const fileName = relativePath.split('?')[0].split('#')[0].split('/').filter(Boolean).pop()
  return fileName ? `${SPONSOR_IMAGE_BASE_PATH}/${fileName}` : ''
}

const PatrocinadoresCrud = () => {
  const [sponsors, setSponsors] = useState([])
  const [selectedSponsorId, setSelectedSponsorId] = useState(null)
  const [formData, setFormData] = useState(createEmptySponsor())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadSponsors = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listPatrocinios()
      setSponsors(Array.isArray(data) ? data : [])
    } catch (error) {
      setSponsors([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os patrocinadores.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSponsors()
  }, [loadSponsors])

  useEffect(() => {
    if (!selectedSponsorId) {
      setFormData(createEmptySponsor())
      return
    }

    const sponsor = sponsors.find((item) => String(item.id) === String(selectedSponsorId))
    if (!sponsor) return

    setFormData({
      ...createEmptySponsor(),
      ...sponsor,
      imagePreviewUrl: getSponsorImageUrl(sponsor.imagem),
    })
  }, [selectedSponsorId, sponsors])

  const orderedSponsors = useMemo(
    () =>
      [...sponsors].sort((left, right) => {
        const leftLabel = left.descricao?.toLowerCase() ?? ''
        const rightLabel = right.descricao?.toLowerCase() ?? ''
        return leftLabel.localeCompare(rightLabel)
      }),
    [sponsors],
  )

  const resetForm = () => {
    setSelectedSponsorId(null)
    setFormData(createEmptySponsor())
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleImageChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setFormData((previous) => ({
      ...previous,
      imageFile: file,
      imageFileName: file.name,
      imagePreviewUrl: objectUrl,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.descricao.trim()) {
      setFeedback({ type: 'danger', message: 'Informe a descrição do patrocinador.' })
      return
    }

    if (!selectedSponsorId && !formData.imageFile) {
      setFeedback({ type: 'danger', message: 'Selecione a imagem do patrocinador.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        id: selectedSponsorId ?? undefined,
        descricao: formData.descricao.trim(),
        imagem: formData.imagem || undefined,
      }

      const response = selectedSponsorId
        ? await updatePatrocinio(selectedSponsorId, payload, formData.imageFile)
        : await createPatrocinio(payload, formData.imageFile)

      await loadSponsors()

      const nextId = response?.id ?? selectedSponsorId ?? null
      setSelectedSponsorId(nextId)
      if (!nextId) {
        setFormData(createEmptySponsor())
      }

      setFeedback({
        type: 'success',
        message: selectedSponsorId
          ? 'Patrocinador atualizado com sucesso.'
          : 'Patrocinador criado com sucesso.',
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o patrocinador.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSponsorId) return

    setIsLoading(true)
    try {
      await deletePatrocinio(selectedSponsorId)
      await loadSponsors()
      resetForm()
      setFeedback({ type: 'success', message: 'Patrocinador removido com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o patrocinador.' })
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
              <h4 className="mb-1">Patrocinadores</h4>
              <div className="text-medium-emphasis">
                Cadastre e edite patrocinadores exibidos no painel.
              </div>
              <SelectedCompetitionBadge className="mt-2" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={5}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Patrocinadores</strong>
              <div className="small text-medium-emphasis">
                Cadastro global via `patrocinio-controller`.
              </div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={resetForm}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody className="p-0">
            {isLoading ? (
              <div className="p-3">
                <CSpinner size="sm" className="me-2" /> Carregando patrocinadores...
              </div>
            ) : orderedSponsors.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum patrocinador cadastrado.</div>
            ) : (
              <CListGroup flush>
                {orderedSponsors.map((sponsor) => (
                  <CListGroupItem
                    key={sponsor.id}
                    action
                    active={String(sponsor.id) === String(selectedSponsorId)}
                    onClick={() => {
                      setSelectedSponsorId(sponsor.id)
                      setFeedback(null)
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div className="fw-semibold">{sponsor.descricao || 'Sem descrição'}</div>
                        <small className="text-medium-emphasis">ID #{sponsor.id}</small>
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
        {feedback && (
          <CAlert color={feedback.type ?? 'success'} className="mb-3">
            {feedback.message}
          </CAlert>
        )}
        <CCard className="h-100">
          <CCardHeader>
            <strong>{selectedSponsorId ? 'Editar patrocinador' : 'Novo patrocinador'}</strong>
            <div className="small text-medium-emphasis">
              Envia descrição e arquivo de imagem em `multipart/form-data`.
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="sponsor-description">Descrição</CFormLabel>
                <CFormInput
                  id="sponsor-description"
                  name="descricao"
                  placeholder="Ex.: Patrocinador master 2026"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="sponsor-image">Imagem</CFormLabel>
                <CFormInput
                  id="sponsor-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!selectedSponsorId}
                />
                {formData.imageFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                )}
                {formData.imagePreviewUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imagePreviewUrl}
                      alt="Prévia do patrocinador"
                      className="img-fluid rounded border"
                      style={{ maxHeight: '220px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />{' '}
                  {selectedSponsorId ? 'Atualizar' : 'Salvar'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  disabled={!selectedSponsorId || isLoading}
                  onClick={handleDelete}
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

export default PatrocinadoresCrud
