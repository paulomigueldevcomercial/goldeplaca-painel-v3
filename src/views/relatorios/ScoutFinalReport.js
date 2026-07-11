import React, { useEffect, useMemo, useState } from 'react'
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
import { cilCloudDownload, cilDescription, cilReload } from '@coreui/icons'
import { downloadScoutFinalReport } from '../../services/relatoriosApi'
import { listScoutFinalCategorias, listScoutFinalCompeticoes } from '../../services/scoutFinalApi'

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const buildFileName = (competicao, categoria) =>
  `scout-final-${competicao}-${String(categoria || '').replaceAll('/', '-')}.pdf`

const ScoutFinalReport = () => {
  const [competitions, setCompetitions] = useState([])
  const [categories, setCategories] = useState([])
  const [competitionFilter, setCompetitionFilter] = useState('')
  const [formData, setFormData] = useState({
    competicao: '',
    categoria: '',
  })
  const [feedback, setFeedback] = useState(null)
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const normalizedCompetitionId = useMemo(
    () => parseNumber(formData.competicao),
    [formData.competicao],
  )

  const filteredCompetitions = useMemo(() => {
    if (!competitionFilter.trim()) return competitions

    const search = competitionFilter.trim().toLowerCase()
    return competitions.filter((competition) =>
      String(competition.nomeCompeticao || competition.descricao || competition.id)
        .toLowerCase()
        .includes(search),
    )
  }, [competitionFilter, competitions])

  useEffect(() => {
    let isMounted = true

    const loadCompetitions = async () => {
      setIsLoadingCompetitions(true)
      setFeedback(null)

      try {
        const data = await listScoutFinalCompeticoes()
        if (!isMounted) return

        const normalizedData = Array.isArray(data) ? data : []
        setCompetitions(normalizedData)

        if (!formData.competicao && normalizedData[0]?.id) {
          setFormData((previous) => ({
            ...previous,
            competicao: String(normalizedData[0].id),
          }))
        }
      } catch (error) {
        if (!isMounted) return
        setCompetitions([])
        setFeedback({
          type: 'danger',
          message: error?.message || 'Não foi possível carregar competições com scout final.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingCompetitions(false)
        }
      }
    }

    loadCompetitions()

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      if (!normalizedCompetitionId) {
        setCategories([])
        setFormData((previous) => ({ ...previous, categoria: '' }))
        return
      }

      setIsLoadingCategories(true)

      try {
        const data = await listScoutFinalCategorias({ competicao: normalizedCompetitionId })
        if (!isMounted) return

        const normalizedData = Array.isArray(data) ? data : []
        setCategories(normalizedData)
        setFormData((previous) => {
          const hasCurrentCategory = normalizedData.some(
            (category) => String(category.chave ?? category.valor) === String(previous.categoria),
          )

          return {
            ...previous,
            categoria: hasCurrentCategory
              ? previous.categoria
              : String(normalizedData[0]?.chave ?? normalizedData[0]?.valor ?? ''),
          }
        })
      } catch (error) {
        if (!isMounted) return
        setCategories([])
        setFormData((previous) => ({ ...previous, categoria: '' }))
        setFeedback({
          type: 'danger',
          message: error?.message || 'Não foi possível carregar categorias do scout final.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [normalizedCompetitionId])

  const handleCompetitionChange = (value) => {
    setFormData({
      competicao: value,
      categoria: '',
    })
  }

  const handleReset = () => {
    setCompetitionFilter('')
    setFormData({
      competicao: competitions[0]?.id ? String(competitions[0].id) : '',
      categoria: '',
    })
    setFeedback(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!normalizedCompetitionId) {
      setFeedback({ type: 'danger', message: 'Selecione uma competição.' })
      return
    }

    if (!formData.categoria) {
      setFeedback({ type: 'danger', message: 'Selecione uma categoria.' })
      return
    }

    setIsDownloading(true)

    try {
      const reportBlob = await downloadScoutFinalReport({
        competicao: normalizedCompetitionId,
        categoria: formData.categoria,
      })
      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = buildFileName(normalizedCompetitionId, formData.categoria)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível gerar o relatório de scout final.',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilDescription} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Scout Final</h4>
              <div className="text-medium-emphasis">
                Gere o PDF de scout final por competição e categoria.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}

        <CCard>
          <CCardHeader>
            <strong>Gerar relatório</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
              <CRow className="g-3">
                <CCol md={7}>
                  <CFormLabel htmlFor="scout-final-competicao-filter">Competição</CFormLabel>
                  <CFormInput
                    id="scout-final-competicao-filter"
                    name="competicao-filter"
                    value={competitionFilter}
                    onChange={(event) => setCompetitionFilter(event.target.value)}
                    placeholder="Buscar competição"
                    disabled={isLoadingCompetitions}
                  />
                  <CFormSelect
                    id="scout-final-competicao"
                    name="competicao"
                    value={formData.competicao}
                    onChange={(event) => handleCompetitionChange(event.target.value)}
                    disabled={isLoadingCompetitions}
                  >
                    <option value="">Selecione</option>
                    {filteredCompetitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {competition.nomeCompeticao ||
                          competition.descricao ||
                          `Competição ${competition.id}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={5}>
                  <CFormLabel htmlFor="scout-final-categoria">Categoria</CFormLabel>
                  <CFormSelect
                    id="scout-final-categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        categoria: event.target.value,
                      }))
                    }
                    disabled={!normalizedCompetitionId || isLoadingCategories}
                  >
                    <option value="">Selecione</option>
                    {categories.map((category) => {
                      const value = category.chave ?? category.valor
                      return (
                        <option key={value} value={value}>
                          {category.valor ?? category.chave}
                        </option>
                      )
                    })}
                  </CFormSelect>
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={
                    !normalizedCompetitionId ||
                    !formData.categoria ||
                    isDownloading ||
                    isLoadingCompetitions ||
                    isLoadingCategories
                  }
                >
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  {isDownloading ? 'Gerando...' : 'Baixar PDF'}
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset}>
                  <CIcon icon={cilReload} className="me-2" />
                  Limpar
                </CButton>
                {(isDownloading || isLoadingCompetitions || isLoadingCategories) && (
                  <CSpinner size="sm" className="align-self-center" />
                )}
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ScoutFinalReport
