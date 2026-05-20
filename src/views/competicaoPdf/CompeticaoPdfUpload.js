import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
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
import { uploadCompeticaoPdf } from '../../services/competicaoPdfApi'

const uploadOptions = {
  rgc: {
    title: 'RGC',
    description: 'Envie o PDF de RGC informando o ID da competição.',
    successMessage: 'PDF de RGC enviado com sucesso.',
  },
  cde: {
    title: 'CDE',
    description: 'Envie o PDF de CDE informando o ID da competição.',
    successMessage: 'PDF de CDE enviado com sucesso.',
  },
  resultado: {
    title: 'RESULTADO JULGAMENTO',
    description: 'Envie o PDF de resultado de julgamento informando o ID da competição.',
    successMessage: 'PDF de resultado de julgamento enviado com sucesso.',
  },
  outrosAnexos: {
    title: 'OUTROS ANEXOS',
    description: 'Envie o PDF de outros anexos informando o ID da competição.',
    successMessage: 'PDF de outros anexos enviado com sucesso.',
  },
}

const emptyUpload = {
  competicaoId: '',
  pdfFile: null,
  pdfFileName: '',
}

const isPdfFile = (file) =>
  file?.type === 'application/pdf' ||
  String(file?.name ?? '')
    .toLowerCase()
    .endsWith('.pdf')

const CompeticaoPdfUpload = ({ variant }) => {
  const config = useMemo(() => uploadOptions[variant] ?? uploadOptions.rgc, [variant])
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

    if (!isPdfFile(file)) {
      setFeedback({ type: 'danger', message: 'Selecione um arquivo no formato PDF.' })
      setFormData((previous) => ({
        ...previous,
        pdfFile: null,
        pdfFileName: '',
      }))
      setFileInputKey((previous) => previous + 1)
      return
    }

    setFeedback(null)
    setFormData((previous) => ({
      ...previous,
      pdfFile: file,
      pdfFileName: file.name,
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

    if (!formData.competicaoId || !formData.pdfFile) {
      setFeedback({
        type: 'danger',
        message: 'Informe o ID da competição e selecione o PDF para envio.',
      })
      return
    }

    if (!isPdfFile(formData.pdfFile)) {
      setFeedback({ type: 'danger', message: 'Selecione um arquivo no formato PDF.' })
      return
    }

    setIsLoading(true)
    try {
      await uploadCompeticaoPdf(variant, formData.competicaoId, formData.pdfFile)
      setFeedback({ type: 'success', message: config.successMessage })
      setFormData(emptyUpload)
      setFileInputKey((previous) => previous + 1)
    } catch (error) {
      setFeedback({ type: 'danger', message: `Não foi possível enviar o PDF de ${config.title}.` })
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
              <h4 className="mb-1">Gerenciamento PDF - {config.title}</h4>
              <div className="text-medium-emphasis">{config.description}</div>
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
            <strong>Enviar {config.title}</strong>
            <div className="small text-medium-emphasis">
              Informe o ID da competição e selecione um arquivo PDF.
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor={`${variant}-competicao-id`}>ID da competição</CFormLabel>
                <CFormInput
                  id={`${variant}-competicao-id`}
                  name="competicaoId"
                  type="number"
                  min="1"
                  placeholder="Ex.: 99"
                  value={formData.competicaoId}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor={`${variant}-pdf-upload`}>Arquivo PDF</CFormLabel>
                <CFormInput
                  key={fileInputKey}
                  id={`${variant}-pdf-upload`}
                  type="file"
                  accept="application/pdf,.pdf"
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

CompeticaoPdfUpload.propTypes = {
  variant: PropTypes.oneOf(['rgc', 'cde', 'resultado', 'outrosAnexos']).isRequired,
}

export default CompeticaoPdfUpload
