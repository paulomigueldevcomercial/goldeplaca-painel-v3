import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CFormLabel, CFormSelect } from '@coreui/react'
import { listCategorias } from '../../services/categoriaApi'

const CategorySelect = ({
  id,
  name = 'categoria',
  label = 'Categoria',
  placeholder = 'Selecione',
  competitionId,
  value,
  required = false,
  disabled = false,
  autoSelectFirst = true,
  onValueChange,
  onError,
}) => {
  const [categories, setCategories] = useState([])
  const errorRef = useRef(onError)

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      if (!competitionId) {
        setCategories([])
        return
      }

      try {
        const categoryData = await listCategorias({ competicao: competitionId })
        if (!isMounted) return
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error) {
        if (!isMounted) return
        setCategories([])
        if (errorRef.current) {
          errorRef.current('Não foi possível carregar categorias da competição.')
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [competitionId])

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.chave ?? category.valor,
        label: category.valor ?? category.chave,
      })),
    [categories],
  )

  useEffect(() => {
    if (!onValueChange) return

    if (!competitionId) {
      if (value) {
        onValueChange('')
      }
      return
    }

    if (!autoSelectFirst || categoryOptions.length === 0) return

    const currentValue = value ?? ''
    const hasSelection = categoryOptions.some((category) => String(category.value) === String(currentValue))
    const firstValue = categoryOptions?.[0]?.value ? String(categoryOptions[0].value) : ''
    const nextValue = hasSelection ? currentValue : firstValue
    if (nextValue !== currentValue) {
      onValueChange(nextValue)
    }
  }, [autoSelectFirst, categoryOptions, competitionId, onValueChange, value])

  return (
    <>
      {label ? <CFormLabel htmlFor={id}>{label}</CFormLabel> : null}
      <CFormSelect
        id={id}
        name={name}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        required={required}
        disabled={disabled || !competitionId}
      >
        <option value="">{placeholder}</option>
        {categoryOptions.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </CFormSelect>
    </>
  )
}

export default CategorySelect
