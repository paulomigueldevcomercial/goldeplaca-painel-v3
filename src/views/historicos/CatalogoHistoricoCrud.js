import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilPlus, cilReload, cilSave, cilTrash } from '@coreui/icons'
import PropTypes from 'prop-types'
import ListPagination from '../../components/ListPagination'

const createEmptyItem = (fieldName) => ({
  id: '',
  [fieldName]: '',
})

const CatalogoHistoricoCrud = ({
  title,
  description,
  listTitle,
  formTitle,
  fieldName,
  fieldLabel,
  searchPlaceholder,
  emptyMessage,
  summaryLabel,
  listItems,
  createItem,
  updateItem,
  deleteItem,
}) => {
  const [items, setItems] = useState([])
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [formData, setFormData] = useState(createEmptyItem(fieldName))
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const getItemName = useCallback((item) => String(item?.[fieldName] ?? '').trim(), [fieldName])

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listItems()
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      setItems([])
      setFeedback({ type: 'danger', message: `Não foi possível carregar ${summaryLabel}.` })
    } finally {
      setIsLoading(false)
    }
  }, [listItems, summaryLabel])

  useEffect(() => {
    let isMounted = true

    Promise.resolve()
      .then(() => listItems())
      .then((data) => {
        if (!isMounted) return
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setItems([])
        setFeedback({ type: 'danger', message: `Não foi possível carregar ${summaryLabel}.` })
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [listItems, summaryLabel])

  const visibleItems = useMemo(() => {
    const ordered = [...items].sort((left, right) =>
      getItemName(left).localeCompare(getItemName(right), 'pt-BR'),
    )
    const term = search.trim().toLowerCase()

    if (!term) return ordered

    return ordered.filter((item) =>
      [item.id, getItemName(item)].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [getItemName, items, search])

  const resetForm = () => {
    setSelectedItemId(null)
    setFormData(createEmptyItem(fieldName))
    setFormErrors({})
    setFeedback(null)
  }

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id)
    setFormData({
      ...createEmptyItem(fieldName),
      ...item,
      id: item.id ?? '',
      [fieldName]: getItemName(item),
    })
    setFormErrors({})
    setFeedback(null)
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
    setFormErrors((previous) => {
      if (!previous[name]) return previous
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!String(formData[fieldName] ?? '').trim()) {
      setFormErrors({ [fieldName]: `Informe ${fieldLabel.toLowerCase()}.` })
      setFeedback({ type: 'danger', message: 'Revise os campos obrigatórios sinalizados.' })
      return
    }

    setIsLoading(true)
    setFormErrors({})
    try {
      const payload = {
        [fieldName]: String(formData[fieldName]).trim(),
      }

      const response = selectedItemId
        ? await updateItem(selectedItemId, payload)
        : await createItem(payload)

      await loadItems()
      setSelectedItemId(response?.id ?? selectedItemId ?? null)
      setFormData({
        ...createEmptyItem(fieldName),
        ...response,
        id: response?.id ?? selectedItemId ?? '',
        [fieldName]: response?.[fieldName] ?? payload[fieldName],
      })
      setFeedback({
        type: 'success',
        message: selectedItemId
          ? 'Registro atualizado com sucesso.'
          : 'Registro cadastrado com sucesso.',
      })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível salvar o registro.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItemId) return

    setIsLoading(true)
    try {
      await deleteItem(selectedItemId)
      await loadItems()
      resetForm()
      setFeedback({ type: 'success', message: 'Registro removido com sucesso.' })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error?.message || 'Não foi possível remover o registro.',
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
            <CIcon icon={cilList} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">{title}</h4>
              <div className="text-medium-emphasis">{description}</div>
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
            <strong>{listTitle}</strong>
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
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>
            {isLoading ? (
              <div className="p-3 text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando...
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="p-3 text-medium-emphasis">{emptyMessage}</div>
            ) : (
              <ListPagination items={visibleItems} summaryLabel={summaryLabel}>
                {(paginatedItems) => (
                  <CListGroup flush>
                    {paginatedItems.map((item) => (
                      <CListGroupItem
                        key={item.id}
                        action
                        active={String(item.id) === String(selectedItemId)}
                        onClick={() => handleSelectItem(item)}
                      >
                        <div className="fw-semibold text-truncate">
                          {getItemName(item) || 'Sem nome'}
                        </div>
                        <div className="small text-medium-emphasis">ID {item.id}</div>
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
            <strong>{selectedItemId ? `Editar ${formTitle}` : `Novo ${formTitle}`}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor={`${fieldName}-nome`}>{fieldLabel}</CFormLabel>
                <CFormInput
                  id={`${fieldName}-nome`}
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleInputChange}
                  invalid={Boolean(formErrors[fieldName])}
                  required
                />
                {formErrors[fieldName] && (
                  <CFormFeedback invalid>{formErrors[fieldName]}</CFormFeedback>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  <CIcon icon={cilSave} className="me-2" />
                  {selectedItemId ? 'Atualizar' : 'Salvar'}
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
                  disabled={!selectedItemId || isLoading}
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

CatalogoHistoricoCrud.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  listTitle: PropTypes.string.isRequired,
  formTitle: PropTypes.string.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldLabel: PropTypes.string.isRequired,
  searchPlaceholder: PropTypes.string.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  summaryLabel: PropTypes.string.isRequired,
  listItems: PropTypes.func.isRequired,
  createItem: PropTypes.func.isRequired,
  updateItem: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired,
}

export default CatalogoHistoricoCrud
