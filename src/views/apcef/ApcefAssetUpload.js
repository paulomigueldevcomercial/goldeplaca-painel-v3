import React, { useEffect, useMemo, useState } from 'react'
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
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilReload, cilSave } from '@coreui/icons'
import {
  listApcefEquipes,
  uploadApcefFotoEquipe,
  uploadApcefImagemCompeticao,
  uploadApcefLogoEquipe,
  uploadApcefPdfRegulamento,
} from '../../services/apcefApi'

const configs = {
  imagemCompeticao: {
    title: 'Imagem da competição APCEF',
    fileLabel: 'Imagem JPG',
    accept: '.jpg,.jpeg,image/jpeg',
    requiresTeam: false,
    requiresPdfType: false,
    successMessage: 'Imagem da competicao enviada com sucesso.',
  },
  logoEquipe: {
    title: 'Logo de equipe APCEF',
    fileLabel: 'Arquivo BMP',
    accept: '.bmp,image/bmp',
    requiresTeam: true,
    requiresPdfType: false,
    successMessage: 'Logo de equipe enviada com sucesso.',
  },
  fotoEquipe: {
    title: 'Foto de equipe APCEF',
    fileLabel: 'Imagem JPG',
    accept: '.jpg,.jpeg,image/jpeg',
    requiresTeam: true,
    requiresPdfType: false,
    successMessage: 'Foto de equipe enviada com sucesso.',
  },
  pdfRegulamento: {
    title: 'PDFs do regulamento APCEF',
    fileLabel: 'Arquivo PDF',
    accept: '.pdf,application/pdf',
    requiresTeam: false,
    requiresPdfType: true,
    successMessage: 'PDF enviado com sucesso.',
  },
}

const pdfTypes = [
  { value: 'rgc', label: 'RGC', path: '/pdf/RGC.pdf' },
  { value: 'anexo1', label: 'Anexo-1 Futsal', path: '/pdf/ANEXO1.pdf' },
  { value: 'anexo2', label: 'Anexo-2 Society', path: '/pdf/ANEXO2.pdf' },
  { value: 'cde', label: 'CDE', path: '/pdf/CDE.pdf' },
]

const emptyUpload = {
  equipe: '',
  pdfType: 'rgc',
  file: null,
  fileName: '',
}

const isAcceptedFile = (file, variant) => {
  const name = String(file?.name ?? '').toLowerCase()
  if (variant === 'logoEquipe') return name.endsWith('.bmp')
  if (variant === 'pdfRegulamento') return name.endsWith('.pdf')
  return name.endsWith('.jpg') || name.endsWith('.jpeg')
}

const ApcefAssetUpload = ({ variant }) => {
  const config = useMemo(() => configs[variant] ?? configs.imagemCompeticao, [variant])
  const [formData, setFormData] = useState(emptyUpload)
  const [equipes, setEquipes] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => {
    if (!config.requiresTeam) return

    listApcefEquipes()
      .then((data) => setEquipes(Array.isArray(data) ? data : []))
      .catch(() => setEquipes([]))
  }, [config.requiresTeam])

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

    if (!isAcceptedFile(file, variant)) {
      setFeedback({ type: 'danger', message: `Selecione um arquivo valido para ${config.title}.` })
      setFormData((previous) => ({ ...previous, file: null, fileName: '' }))
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

    const equipe = formData.equipe.trim()

    if (config.requiresTeam && !equipe) {
      setFeedback({ type: 'danger', message: 'Informe o nome da equipe.' })
      return
    }

    if (!formData.file || !isAcceptedFile(formData.file, variant)) {
      setFeedback({ type: 'danger', message: `Selecione o arquivo correto para ${config.title}.` })
      return
    }

    setIsLoading(true)
    try {
      const response =
        variant === 'imagemCompeticao'
          ? await uploadApcefImagemCompeticao(formData.file)
          : variant === 'logoEquipe'
            ? await uploadApcefLogoEquipe(equipe, formData.file)
            : variant === 'fotoEquipe'
              ? await uploadApcefFotoEquipe(equipe, formData.file)
              : await uploadApcefPdfRegulamento(formData.pdfType, formData.file)

      setFeedback({
        type: 'success',
        message: `${config.successMessage}${response?.path ? ` Caminho: ${response.path}` : ''}`,
      })
      setFormData(emptyUpload)
      setFileInputKey((previous) => previous + 1)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Nao foi possivel enviar o arquivo.',
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
              <h4 className="mb-1">{config.title}</h4>
              <div className="text-medium-emphasis">
                O envio substitui o arquivo estatico usado pelo site APCEF.
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

        <CCard>
          <CCardHeader>
            <strong>Enviar arquivo</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              {config.requiresTeam && (
                <div>
                  <CFormLabel htmlFor={`${variant}-equipe`}>Equipe</CFormLabel>
                  <CFormInput
                    id={`${variant}-equipe`}
                    name="equipe"
                    list="apcef-equipes"
                    value={formData.equipe}
                    onChange={handleInputChange}
                    placeholder="Ex.: SANTA_CRUZ"
                    required
                  />
                  <datalist id="apcef-equipes">
                    {equipes.map((equipe) => (
                      <option key={equipe} value={equipe} />
                    ))}
                  </datalist>
                </div>
              )}

              {config.requiresPdfType && (
                <div>
                  <CFormLabel htmlFor="apcef-pdf-type">Tipo de PDF</CFormLabel>
                  <CFormSelect
                    id="apcef-pdf-type"
                    name="pdfType"
                    value={formData.pdfType}
                    onChange={handleInputChange}
                  >
                    {pdfTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.path})
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              )}

              <div>
                <CFormLabel htmlFor={`${variant}-file`}>{config.fileLabel}</CFormLabel>
                <CFormInput
                  key={fileInputKey}
                  id={`${variant}-file`}
                  type="file"
                  accept={config.accept}
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

ApcefAssetUpload.propTypes = {
  variant: PropTypes.oneOf(['imagemCompeticao', 'logoEquipe', 'fotoEquipe', 'pdfRegulamento'])
    .isRequired,
}

export default ApcefAssetUpload
