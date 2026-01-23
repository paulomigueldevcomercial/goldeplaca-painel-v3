import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CFormLabel, CFormSelect } from '@coreui/react'
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

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

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
        label: competition.nomeCompeticao || competition.descricao || `Competição ${competition.id}`,
      })),
    [competitions],
  )

  useEffect(() => {
    if (!autoSelectFirst || !onValueChange) return
    const currentValue = value ?? ''
    const hasSelection = competitionOptions.some(
      (competition) => String(competition.value) === String(currentValue),
    )
    const firstValue = competitionOptions?.[0]?.value ? String(competitionOptions[0].value) : ''
    const nextValue = hasSelection ? currentValue : firstValue
    if (nextValue !== currentValue) {
      onValueChange(nextValue)
    }
  }, [autoSelectFirst, competitionOptions, onValueChange, value])

  return (
    <>
      {label ? <CFormLabel htmlFor={id}>{label}</CFormLabel> : null}
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
        {competitionOptions.map((competition) => (
          <option key={competition.value} value={competition.value}>
            {competition.label}
          </option>
        ))}
      </CFormSelect>
    </>
  )
}

export default CompetitionSelect
