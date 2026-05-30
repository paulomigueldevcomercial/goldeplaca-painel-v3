import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CFormInput, CFormLabel, CFormSelect } from '@coreui/react'
import { listCompeticoes } from '../../services/competicaoApi'

const CompetitionSelect = ({
  id,
  name = 'competicao',
  label = 'Competição',
  placeholder = 'Selecione',
  value,
  size,
  className,
  ariaLabel,
  required = false,
  disabled = false,
  autoSelectFirst = true,
  onValueChange,
  onError,
}) => {
  const [competitions, setCompetitions] = useState([])
  const errorRef = useRef(onError)
  const valueChangeRef = useRef(onValueChange)

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    valueChangeRef.current = onValueChange
  }, [onValueChange])

  useEffect(() => {
    let isMounted = true

    const loadCompetitions = async () => {
      try {
        const competitionData = await listCompeticoes()
        if (!isMounted) return
        setCompetitions(Array.isArray(competitionData) ? competitionData : [])
      } catch (error) {
        if (!isMounted) return
        setCompetitions([])
        if (errorRef.current) {
          errorRef.current('Não foi possível carregar competições.')
        }
      }
    }

    loadCompetitions()

    return () => {
      isMounted = false
    }
  }, [])

  const competitionOptions = useMemo(
    () =>
      competitions.map((competition) => ({
        value: competition.id,
        label:
          competition.nomeCompeticao || competition.descricao || `Competição ${competition.id}`,
      })),
    [competitions],
  )

  const [filterValue, setFilterValue] = useState('')

  useEffect(() => {
    if (!autoSelectFirst || !valueChangeRef.current) return
    if (competitionOptions.length === 0) return

    const currentValue = value ?? ''
    const hasSelection = competitionOptions.some(
      (competition) => String(competition.value) === String(currentValue),
    )
    const firstValue = competitionOptions?.[0]?.value ? String(competitionOptions[0].value) : ''
    const nextValue = hasSelection ? currentValue : firstValue
    if (nextValue !== currentValue) {
      valueChangeRef.current(nextValue)
    }
  }, [autoSelectFirst, competitionOptions, value])

  const filteredOptions = useMemo(() => {
    if (!filterValue) return competitionOptions
    const search = filterValue.trim().toLowerCase()
    if (!search) return competitionOptions
    return competitionOptions.filter((competition) =>
      String(competition.label).toLowerCase().includes(search),
    )
  }, [competitionOptions, filterValue])

  return (
    <>
      {label ? <CFormLabel htmlFor={id}>{label}</CFormLabel> : null}
      <CFormInput
        id={id ? `${id}-filter` : `${name}-filter`}
        name={`${name}-filter`}
        value={filterValue}
        onChange={(event) => setFilterValue(event.target.value)}
        placeholder={`Buscar ${label?.toLowerCase() || 'competição'}`}
        required={required}
        disabled={disabled}
        size={size}
        className={className}
        aria-label={ariaLabel}
      />
      <CFormSelect
        id={id}
        name={name}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        required={required}
        disabled={disabled}
        size={size}
        className={className}
        aria-label={ariaLabel}
      >
        <option value="">{placeholder}</option>
        {filteredOptions.map((competition) => (
          <option key={competition.value} value={competition.value}>
            {competition.label}
          </option>
        ))}
      </CFormSelect>
    </>
  )
}

export default CompetitionSelect
