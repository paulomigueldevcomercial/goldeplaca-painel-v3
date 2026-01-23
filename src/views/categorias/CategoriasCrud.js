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
import { cilList, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import { createCategoria, deleteCategoria, listCategorias, updateCategoria } from '../../services/categoriaApi'
import { listCompeticoes } from '../../services/competicaoApi'
import { listEquipes } from '../../services/equipeApi'

const createEmptyCategory = () => ({
  categoria: '',
  categoriaAtual: '',
  novaCategoria: '',
  equipeIds: [],
  competicaoFiltro: '',
})

const CategoriasCrud = () => {
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])
  const [competitions, setCompetitions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState(createEmptyCategory())
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const categoryData = await listCategorias()
      setCategories(Array.isArray(categoryData) ? categoryData : [])
    } catch (error) {
      setCategories([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as categorias.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadTeams = useCallback(
    async (competitionId) => {
      try {
        const teamData = await listEquipes({ competicaoId: competitionId || undefined })
        setTeams(Array.isArray(teamData) ? teamData : [])
      } catch (error) {
        setTeams([])
      }
    },
    [],
  )

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const competitionData = await listCompeticoes()
        setCompetitions(Array.isArray(competitionData) ? competitionData : [])
        const firstCompetitionId = competitionData?.[0]?.id ? String(competitionData[0].id) : ''

        setFormData((previous) => ({
          ...previous,
          competicaoFiltro: previous.competicaoFiltro || firstCompetitionId,
        }))
        await loadTeams(firstCompetitionId)
      } catch (error) {
        setFeedback({ type: 'danger', message: 'Não foi possível carregar competições e equipes.' })
      }
    }

    loadSetup()
    loadCategories()
  }, [loadCategories, loadTeams])

  useEffect(() => {
    if (!formData.competicaoFiltro) return
    loadTeams(formData.competicaoFiltro)
  }, [formData.competicaoFiltro, loadTeams])

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: team.id, label: team.equipe })),
    [teams],
  )

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setFormData((previous) => ({
      ...previous,
      categoriaAtual: category.chave ?? category.valor,
      novaCategoria: category.valor ?? category.chave,
    }))
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleTeamSelect = ({ target }) => {
    const selectedValues = Array.from(target.selectedOptions).map((option) => Number(option.value))
    setFormData((previous) => ({
      ...previous,
      equipeIds: selectedValues,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.categoria) return

    setIsLoading(true)
    try {
      await createCategoria({
        categoria: formData.categoria,
        equipeIds: formData.equipeIds,
      })
      setFeedback({ type: 'success', message: 'Categoria criada com sucesso.' })
      setFormData((previous) => ({
        ...previous,
        categoria: '',
        equipeIds: [],
      }))
      await loadCategories()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível criar a categoria.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!formData.categoriaAtual || !formData.novaCategoria) return

    setIsLoading(true)
    try {
      await updateCategoria(formData.categoriaAtual, { novaCategoria: formData.novaCategoria })
      setFeedback({ type: 'success', message: 'Categoria atualizada com sucesso.' })
      await loadCategories()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível atualizar a categoria.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.categoriaAtual) return

    setIsLoading(true)
    try {
      await deleteCategoria(formData.categoriaAtual)
      setFeedback({ type: 'success', message: 'Categoria removida com sucesso.' })
      setSelectedCategory(null)
      setFormData((previous) => ({
        ...createEmptyCategory(),
        competicaoFiltro: previous.competicaoFiltro,
      }))
      await loadCategories()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a categoria.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedCategory(null)
    setFormData((previous) => ({
      ...createEmptyCategory(),
      competicaoFiltro: previous.competicaoFiltro,
    }))
    setFeedback(null)
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilList} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Categorias</h4>
              <div className="text-medium-emphasis">
                Utilize os endpoints de categorias para criar, editar ou remover categorias disponíveis.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={4}>
        <CCard className="h-100">
          <CCardHeader>
            <strong>Categorias</strong>
          </CCardHeader>
          <CCardBody className="p-0">
            {isLoading ? (
              <div className="p-3 text-center">
                <CSpinner size="sm" /> Carregando categorias...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhuma categoria cadastrada.</div>
            ) : (
              <CListGroup flush>
                {categories.map((category) => (
                  <CListGroupItem
                    key={category.chave ?? category.valor}
                    action
                    active={
                      (category.chave ?? category.valor) === (selectedCategory?.chave ?? selectedCategory?.valor)
                    }
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="fw-semibold">{category.valor ?? category.chave}</div>
                    <small className="text-medium-emphasis">Chave: {category.chave ?? category.valor}</small>
                  </CListGroupItem>
                ))}
              </CListGroup>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={8}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{selectedCategory ? 'Editar categoria' : 'Nova categoria'}</strong>
              <div className="small text-medium-emphasis">Cadastre ou atualize categorias para uso nas competições.</div>
            </div>
            <CButton color="primary" size="sm" variant="outline" onClick={handleReset}>
              <CIcon icon={cilPlus} className="me-2" /> Novo
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="categoria-nome">Nome da categoria</CFormLabel>
                <CFormInput
                  id="categoria-nome"
                  name="categoria"
                  placeholder="Ex.: Sub-17"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="categoria-competicao">Competição para listar equipes</CFormLabel>
                  <CFormSelect
                    id="categoria-competicao"
                    name="competicaoFiltro"
                    value={formData.competicaoFiltro}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione</option>
                    {competitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {competition.nomeCompeticao || competition.descricao || `Competição ${competition.id}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="categoria-equipes">Equipes vinculadas</CFormLabel>
                  <CFormSelect
                    id="categoria-equipes"
                    multiple
                    value={formData.equipeIds.map((id) => String(id))}
                    onChange={handleTeamSelect}
                  >
                    {teamOptions.map((team) => (
                      <option key={team.value} value={team.value}>
                        {team.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" /> Criar
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset} disabled={isLoading}>
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
              </div>
            </CForm>

            <hr className="my-4" />

            <CForm className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="categoria-atual">Categoria atual</CFormLabel>
                <CFormInput
                  id="categoria-atual"
                  name="categoriaAtual"
                  value={formData.categoriaAtual}
                  onChange={handleInputChange}
                  placeholder="Selecione na lista ao lado"
                />
              </div>

              <div>
                <CFormLabel htmlFor="categoria-nova">Novo nome</CFormLabel>
                <CFormInput
                  id="categoria-nova"
                  name="novaCategoria"
                  value={formData.novaCategoria}
                  onChange={handleInputChange}
                />
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="button" onClick={handleUpdate} disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" /> Atualizar
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  type="button"
                  onClick={handleDelete}
                  disabled={!formData.categoriaAtual || isLoading}
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

export default CategoriasCrud
