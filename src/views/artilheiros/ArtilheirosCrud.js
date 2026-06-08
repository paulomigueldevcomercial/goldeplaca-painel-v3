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
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import SelectedCompetitionBadge from '../../components/SelectedCompetitionBadge'
import {
  createArtilheiroGeral,
  deleteArtilheiroGeral,
  listArtilheirosGerais,
  updateArtilheiroGeral,
} from '../../services/artilheiroGeralApi'
import { listCompeticoesFinalizadas } from '../../services/competicaoApi'

const ACCEPTED_IMAGE_TYPES = '.png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif'

const createEmptyArtilheiro = () => ({
  id: '',
  nome: '',
  gols: '',
  categoria: '',
  equipe: '',
  competicao: '',
  ano: '',
  imagem: '',
  imageFile: null,
  imageFileName: '',
  imagePreviewUrl: '',
})

const NON_NEGATIVE_NUMBER_FIELDS = new Set(['gols'])

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const parseNonNegativeNumber = (value) => {
  const parsed = parseNumber(value)
  if (parsed === null) return null
  return Math.max(0, parsed)
}

const normalizeNonNegativeInputValue = (value) => {
  if (value === '') return ''
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return value
  return parsed < 0 ? '0' : value
}

const getCompetitionLabel = (competition) =>
  competition?.nomeCompeticao ||
  competition?.descricao ||
  competition?.temporada ||
  `Competição ${competition?.id ?? ''}`.trim()

const normalizeImagePreviewUrl = (value) => {
  const url = String(value ?? '').trim()
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  if (url.startsWith('/')) return url
  return `/${url.replace(/^painel\//, '')}`
}

const ArtilheirosCrud = () => {
  const [artilheiros, setArtilheiros] = useState([])
  const [finishedCompetitions, setFinishedCompetitions] = useState([])
  const [selectedArtilheiroId, setSelectedArtilheiroId] = useState(null)
  const [formData, setFormData] = useState(createEmptyArtilheiro())
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false)

  const loadArtilheiros = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listArtilheirosGerais()
      setArtilheiros(Array.isArray(data) ? data : [])
    } catch (error) {
      setArtilheiros([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os artilheiros.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFinishedCompetitions = useCallback(async () => {
    setIsLoadingCompetitions(true)
    try {
      const data = await listCompeticoesFinalizadas()
      setFinishedCompetitions(Array.isArray(data) ? data : [])
    } catch (error) {
      setFinishedCompetitions([])
      setFeedback({
        type: 'danger',
        message: 'Não foi possível carregar as competições finalizadas.',
      })
    } finally {
      setIsLoadingCompetitions(false)
    }
  }, [])

  useEffect(() => {
    loadArtilheiros()
  }, [loadArtilheiros])

  useEffect(() => {
    loadFinishedCompetitions()
  }, [loadFinishedCompetitions])

  const visibleArtilheiros = useMemo(() => {
    const ordered = [...artilheiros].sort((left, right) => {
      const leftGoals = Number(left.gols ?? 0)
      const rightGoals = Number(right.gols ?? 0)
      return rightGoals - leftGoals
    })
    const term = search.trim().toLowerCase()

    if (!term) return ordered

    return ordered.filter((artilheiro) =>
      [artilheiro.nome, artilheiro.equipe, artilheiro.categoria, artilheiro.ano].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [artilheiros, search])

  const resetForm = () => {
    setSelectedArtilheiroId(null)
    setFormData(createEmptyArtilheiro())
    setFeedback(null)
  }

  const handleSelectArtilheiro = (artilheiro) => {
    setSelectedArtilheiroId(artilheiro.id)
    setFormData({
      ...createEmptyArtilheiro(),
      ...artilheiro,
      id: artilheiro.id ?? '',
      competicao:
        artilheiro.competicao === null || artilheiro.competicao === undefined
          ? ''
          : String(artilheiro.competicao),
      imagePreviewUrl: normalizeImagePreviewUrl(artilheiro.imagem),
    })
    setFeedback(null)
  }

  const hasSelectedFinishedCompetition = finishedCompetitions.some(
    (competition) => String(competition.id) === String(formData.competicao),
  )

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: NON_NEGATIVE_NUMBER_FIELDS.has(name) ? normalizeNonNegativeInputValue(value) : value,
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

    if (!formData.nome.trim()) {
      setFeedback({ type: 'danger', message: 'Informe o nome do artilheiro.' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        id: selectedArtilheiroId
          ? parseNumber(selectedArtilheiroId)
          : (parseNumber(formData.id) ?? undefined),
        nome: formData.nome.trim(),
        gols: parseNonNegativeNumber(formData.gols),
        categoria: formData.categoria.trim(),
        equipe: formData.equipe.trim(),
        competicao: parseNumber(formData.competicao),
        ano: parseNumber(formData.ano),
        imagem: formData.imagem || undefined,
      }

      const response = selectedArtilheiroId
        ? await updateArtilheiroGeral(selectedArtilheiroId, payload, formData.imageFile)
        : await createArtilheiroGeral(payload, formData.imageFile)

      await loadArtilheiros()
      setSelectedArtilheiroId(response?.id ?? selectedArtilheiroId ?? null)
      setFormData((previous) => ({
        ...previous,
        imageFile: null,
        imageFileName: '',
      }))
      setFeedback({
        type: 'success',
        message: selectedArtilheiroId
          ? 'Artilheiro atualizado com sucesso.'
          : 'Artilheiro cadastrado com sucesso.',
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o artilheiro.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedArtilheiroId) return

    setIsLoading(true)
    try {
      await deleteArtilheiroGeral(selectedArtilheiroId)
      await loadArtilheiros()
      resetForm()
      setFeedback({ type: 'success', message: 'Artilheiro removido com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o artilheiro.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilPeople} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Artilheiros</h4>
              <div className="text-medium-emphasis">
                Cadastro dos maiores artilheiros com imagem de destaque.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {feedback && (
        <CCol xs={12}>
          <CAlert color={feedback.type} className="mb-0">
            {feedback.message}
          </CAlert>
        </CCol>
      )}

      <CCol lg={4}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Artilheiros</strong>
            <CButton color="primary" size="sm" variant="outline" onClick={resetForm}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormInput
                type="search"
                value={search}
                onChange={({ target }) => setSearch(target.value)}
                placeholder="Pesquisar por nome, equipe ou ano"
                aria-label="Pesquisar artilheiros"
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando artilheiros...
              </div>
            ) : visibleArtilheiros.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum artilheiro cadastrado.</div>
            ) : (
              <ListPagination items={visibleArtilheiros} summaryLabel="artilheiros">
                {(paginatedArtilheiros) => (
                  <CListGroup flush>
                    {paginatedArtilheiros.map((artilheiro) => (
                      <CListGroupItem
                        key={artilheiro.id}
                        action
                        active={String(artilheiro.id) === String(selectedArtilheiroId)}
                        onClick={() => handleSelectArtilheiro(artilheiro)}
                      >
                        <div className="d-flex justify-content-between gap-2">
                          <div className="text-truncate">{artilheiro.nome || 'Sem nome'}</div>
                          <span className="small text-medium-emphasis">
                            {artilheiro.gols ?? 0} gols
                          </span>
                        </div>
                        <div className="small text-medium-emphasis">
                          {artilheiro.equipe || '-'} - {artilheiro.ano || '-'}
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

      <CCol lg={8}>
        <CCard>
          <CCardHeader>
            <strong>{selectedArtilheiroId ? 'Editar artilheiro' : 'Novo artilheiro'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={8}>
                  <CFormLabel htmlFor="artilheiro-nome">Nome</CFormLabel>
                  <CFormInput
                    id="artilheiro-nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="artilheiro-gols">Gols</CFormLabel>
                  <CFormInput
                    id="artilheiro-gols"
                    name="gols"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.gols}
                    onChange={handleInputChange}
                    onWheel={({ currentTarget }) => currentTarget.blur()}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="artilheiro-equipe">Equipe</CFormLabel>
                  <CFormInput
                    id="artilheiro-equipe"
                    name="equipe"
                    value={formData.equipe}
                    onChange={handleInputChange}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="artilheiro-categoria">Categoria</CFormLabel>
                  <CFormInput
                    id="artilheiro-categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="artilheiro-competicao">Competição</CFormLabel>
                  <CFormSelect
                    id="artilheiro-competicao"
                    name="competicao"
                    value={formData.competicao}
                    onChange={handleInputChange}
                    disabled={isLoadingCompetitions}
                  >
                    <option value="">
                      {isLoadingCompetitions ? 'Carregando competições...' : 'Selecione'}
                    </option>
                    {formData.competicao && !hasSelectedFinishedCompetition && (
                      <option value={formData.competicao}>Competição #{formData.competicao}</option>
                    )}
                    {finishedCompetitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {getCompetitionLabel(competition)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="artilheiro-ano">Ano</CFormLabel>
                  <CFormInput
                    id="artilheiro-ano"
                    name="ano"
                    type="number"
                    value={formData.ano}
                    onChange={handleInputChange}
                  />
                </CCol>
              </CRow>

              <div>
                <CFormLabel htmlFor="artilheiro-imagem">Imagem</CFormLabel>
                <CFormInput
                  id="artilheiro-imagem"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  onChange={handleImageChange}
                />
                {formData.imageFileName && (
                  <div className="form-text">Arquivo selecionado: {formData.imageFileName}</div>
                )}
                {formData.imagePreviewUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imagePreviewUrl}
                      alt="Prévia do artilheiro"
                      className="img-fluid rounded border"
                      style={{ maxHeight: '220px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />
                  {selectedArtilheiroId ? 'Atualizar' : 'Salvar'}
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
                  disabled={!selectedArtilheiroId || isLoading}
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

export default ArtilheirosCrud
