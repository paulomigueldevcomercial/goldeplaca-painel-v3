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
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import { uploadSumula } from '../../services/sumulaApi'

const emptyUpload = {
  codigo: '',
  pdfFile: null,
  pdfFileName: '',
}

const UploadSumulaCrud = () => {
  const [formData, setFormData] = useState(emptyUpload)
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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

    setFormData((previous) => ({
      ...previous,
      pdfFile: file,
      pdfFileName: file.name,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!formData.codigo || !formData.pdfFile) {
      setFeedback({ type: 'danger', message: 'Informe o ID do jogo e selecione o PDF da súmula.' })
      return
    }

    setIsLoading(true)
    try {
      await uploadSumula(formData.codigo, formData.pdfFile)
      setFeedback({ type: 'success', message: 'Súmula enviada com sucesso.' })
      setFormData(emptyUpload)
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível enviar a súmula.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
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
                Envie a súmula em PDF informando o IDs do jogo. Os dados serão enviados para a API oficial.
              </div>
              <SelectedCompetitionBadge className="mt-2" />
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
            <strong>Enviar súmula</strong>
            <div className="small text-medium-emphasis">Informe o ID do jogo e faça o upload do PDF.</div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="sumula-codigo">ID do jogo</CFormLabel>
                <CFormInput
                  id="sumula-codigo"
                  name="codigo"
                  placeholder="Ex.: 1203"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="sumula-pdf-upload">Upload da súmula (PDF)</CFormLabel>
                <CFormInput
                  id="sumula-pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                />
                {formData.pdfFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.pdfFileName}</div>
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

export default UploadSumulaCrud
