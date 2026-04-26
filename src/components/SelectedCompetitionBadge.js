import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { CBadge } from '@coreui/react'
import { listCompeticoes } from '../services/competicaoApi'

const SelectedCompetitionBadge = ({ className = '' }) => {
  const selectedCompetitionId = useSelector((state) => state.selectedCompetitionId)
  const [competitions, setCompetitions] = useState([])

  useEffect(() => {
    listCompeticoes()
      .then((data) => {
        setCompetitions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setCompetitions([])
      })
  }, [])

  const selectedCompetition = useMemo(
    () =>
      competitions.find((competition) => String(competition.id) === String(selectedCompetitionId)),
    [competitions, selectedCompetitionId],
  )

  const selectedCompetitionLabel = selectedCompetition
    ? selectedCompetition.nomeCompeticao || selectedCompetition.descricao || selectedCompetition.id
    : selectedCompetitionId
      ? `Competição ${selectedCompetitionId}`
      : 'Nenhum campeonato selecionado'

  return (
    <div className={`d-flex flex-wrap align-items-center gap-2 ${className}`.trim()}>
      <span className="fw-semibold">Campeonato selecionado:</span>
      <CBadge color={selectedCompetitionId ? 'primary' : 'secondary'}>
        {selectedCompetitionLabel}
      </CBadge>
      {selectedCompetition?.temporada && (
        <CBadge color="secondary">Temporada {selectedCompetition.temporada}</CBadge>
      )}
    </div>
  )
}

export default SelectedCompetitionBadge
