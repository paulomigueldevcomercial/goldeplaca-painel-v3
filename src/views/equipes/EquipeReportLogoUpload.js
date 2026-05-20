import React, { useState } from 'react'
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
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilReload, cilSave } from '@coreui/icons'
import { uploadEquipeReportLogo } from '../../services/equipeReportLogoApi'

const emptyUpload = {
  time: '',
  file: null,
  fileName: '',
}

const isJpgFile = (file) =>
  String(file?.name ?? '')
    .toLowerCase()
    .endsWith('.jpg')

const getResponseMessage = (response) => {
  if (!response || typeof response !== 'object') return ''

  return Object.values(response).find((value) => typeof value === 'string') ?? ''
}

const EquipeReportLogoUpload = () => {
  const [formData, setFormData] = useState(emptyUpload)
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleFileChange = ({ target }) => {
    const file = target.files?.[0]
    if (!file) return

    if (!isJpgFile(file)) {
      setFeedback({ type: 'danger', message: 'Selecione um arquivo no formato .jpg.' })
      setFormData((previous) => ({
        ...previous,
        file: null,
        fileName: '',
      }))
      setFileInputKey((previous) => previous + 1)
      return
    }

    setFeedback(null)
    setFormData((previous) => ({
      ...previous,
      file,
      fileName: file.name,
    }))
  }

  const handleReset = () => {
    setFormData(emptyUpload)
    setFeedback(null)
    setFileInputKey((previous) => previous + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    const time = formData.time.trim()

    if (!time || !formData.file) {
      setFeedback({
        type: 'danger',
        message: 'Informe o nome do time e selecione o escudo em JPG.',
      })
      return
    }

    if (!isJpgFile(formData.file)) {
      setFeedback({ type: 'danger', message: 'Selecione um arquivo no formato .jpg.' })
      return
    }

    setIsLoading(true)
    try {
      const response = await uploadEquipeReportLogo(time, formData.file)
      setFeedback({
        type: 'success',
        message: getResponseMessage(response) || 'Escudo de equipe enviado com sucesso.',
      })
      setFormData(emptyUpload)
      setFileInputKey((previous) => previous + 1)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Não foi possível enviar o escudo de equipe.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilCloudUpload} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Escudo de equipe</h4>
              <div className="text-medium-emphasis">
                Envio de escudo JPG usado nos relatórios de equipe.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={12}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}

        <CCard className="h-100">
          <CCardHeader>
            <strong>Enviar escudo</strong>
            <div className="small text-medium-emphasis">
              Informe o nome do time e selecione um arquivo .jpg.
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="equipe-report-logo-time">Nome do time</CFormLabel>
                <CFormInput
                  id="equipe-report-logo-time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  placeholder="Ex.: Gol de Placa"
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="equipe-report-logo-file">Arquivo JPG</CFormLabel>
                <CFormInput
                  key={fileInputKey}
                  id="equipe-report-logo-file"
                  type="file"
                  accept=".jpg"
                  onChange={handleFileChange}
                  required
                />
                {formData.fileName && (
                  <div className="form-text">Arquivo selecionado: {formData.fileName}</div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" /> {isLoading ? 'Enviando...' : 'Enviar'}
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset}>
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
                {isLoading && <CSpinner size="sm" className="ms-2" />}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default EquipeReportLogoUpload
