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
  CListGroup,
  CListGroupItem,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'

const emptyUpload = {
  gameId: '',
  imageUrl: '',
  imageFileName: '',
  uploadedAt: '',
}

const initialUploads = [
  {
    id: 'sum-1201',
    gameId: 'JOGO-1201',
    imageUrl: 'https://via.placeholder.com/320x200?text=Sumula+JOGO-1201',
    uploadedAt: '05/02/2025',
  },
  {
    id: 'sum-1202',
    gameId: 'JOGO-1202',
    imageUrl: 'https://via.placeholder.com/320x200?text=Sumula+JOGO-1202',
    uploadedAt: '06/02/2025',
  },
]

const UploadSumulaCrud = () => {
  const [uploads, setUploads] = useState(initialUploads)
  const [selectedUploadId, setSelectedUploadId] = useState(initialUploads[0]?.id ?? null)
  const [formData, setFormData] = useState(emptyUpload)
  const [feedback, setFeedback] = useState(null)

  const selectedUpload = useMemo(
    () => uploads.find((upload) => upload.id === selectedUploadId) ?? null,
    [uploads, selectedUploadId],
  )

  useEffect(() => {
    if (!selectedUploadId && uploads.length) {
      setSelectedUploadId(uploads[0].id)
    }
  }, [uploads, selectedUploadId])

  useEffect(() => {
    if (!selectedUpload) {
      setFormData(emptyUpload)
      return
    }

    setFormData({ ...emptyUpload, ...selectedUpload, imageFileName: selectedUpload.imageFileName ?? '' })
  }, [selectedUpload])

  const handleUploadSelect = (uploadId) => {
    setSelectedUploadId(uploadId)
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

  const handleFileChange = ({ target }) => {
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

    const uploadId = selectedUploadId ?? `sum-${Date.now()}`
    const payload = {
      ...formData,
      id: uploadId,
      uploadedAt: formData.uploadedAt || new Date().toLocaleDateString('pt-BR'),
    }

    setUploads((previous) => {
      const exists = previous.some((item) => item.id === uploadId)
      return exists
        ? previous.map((item) => (item.id === uploadId ? payload : item))
        : [...previous, payload]
    })

    setSelectedUploadId(uploadId)
    setFeedback(selectedUploadId ? 'Súmula atualizada com sucesso.' : 'Upload de súmula criado.')
  }

  const handleDelete = () => {
    if (!selectedUploadId) return

    setUploads((previous) => previous.filter((item) => item.id !== selectedUploadId))
    setSelectedUploadId(null)
    setFormData(emptyUpload)
    setFeedback('Súmula removida.')
  }

  const handleReset = () => {
    setSelectedUploadId(null)
    setFormData(emptyUpload)
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilCloudUpload} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Upload de Súmulas</h4>
              <div className="text-medium-emphasis">
                Cadastre, atualize ou remova súmulas informando o ID do jogo e anexando a imagem do arquivo.
                Os dados são mantidos apenas na memória para demonstração do fluxo do CRUD.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Envios cadastrados</strong>
              <div className="small text-medium-emphasis">ID do jogo + data do upload</div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={handleReset}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody className="p-0">
            {uploads.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma súmula cadastrada ainda.</div>
            ) : (
              <CListGroup flush>
                {uploads.map((upload) => (
                  <CListGroupItem
                    key={upload.id}
                    action
                    active={upload.id === selectedUploadId}
                    onClick={() => handleUploadSelect(upload.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{upload.gameId}</div>
                        <small className="text-medium-emphasis">Enviado em {upload.uploadedAt}</small>
                      </div>
                      <CBadge color="success" shape="rounded-pill">Súmula</CBadge>
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
          <CCardHeader>
            <strong>{selectedUploadId ? 'Editar súmula' : 'Nova súmula'}</strong>
            <div className="small text-medium-emphasis">Informe o ID do jogo e faça o upload da imagem.</div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="sumula-game">ID do jogo</CFormLabel>
                <CFormInput
                  id="sumula-game"
                  name="gameId"
                  placeholder="Ex.: JOGO-1203"
                  value={formData.gameId}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="sumula-image-upload">Upload da súmula (imagem)</CFormLabel>
                <CFormInput
                  id="sumula-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {formData.imageFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                )}
              </div>

              <div>
                <CFormLabel htmlFor="sumula-image-url">URL da imagem (opcional)</CFormLabel>
                <CFormInput
                  id="sumula-image-url"
                  name="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <CFormLabel htmlFor="sumula-uploaded">Data do upload</CFormLabel>
                <CFormInput
                  id="sumula-uploaded"
                  name="uploadedAt"
                  placeholder="dd/mm/aaaa"
                  value={formData.uploadedAt}
                  onChange={handleInputChange}
                />
              </div>

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
                  disabled={!selectedUploadId}
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

export default UploadSumulaCrud
