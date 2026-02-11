import React, { useCallback, useMemo, useState } from 'react'
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilPencil, cilPlus, cilReload, cilSave, cilTrash, cilX } from '@coreui/icons'
import CompetitionSelect from '../../components/forms/CompetitionSelect'
import CategorySelect from '../../components/forms/CategorySelect'
import { createSumulas, deleteSumula, listSumulas, updateSumula } from '../../services/sumulasApi'

const createEmptyPlayer = () => ({
  nomeJogador: '',
  cartaoAmarelo: '',
  cartaoVermelho: '',
  gols: '',
  capitao: '',
  tipoJogador: '',
})

const createEmptyBatch = () => ({
  jogoId: '',
  time: '',
  competicao: '',
  categoria: '',
  arbitro: '',
  mesario: '',
})

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const SumulasCrud = () => {
  const [filters, setFilters] = useState({ jogoId: '', time: '', competicaoId: '' })
  const [sumulas, setSumulas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [batch, setBatch] = useState(createEmptyBatch())
  const [players, setPlayers] = useState([createEmptyPlayer()])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchFeedback, setBatchFeedback] = useState(null)

  const [editSumula, setEditSumula] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editFeedback, setEditFeedback] = useState(null)

  const groupedSumulas = useMemo(() => {
    return sumulas.reduce((acc, item) => {
      const key = `${item.jogo ?? 'sem-jogo'}-${item.time ?? 'sem-time'}`
      if (!acc[key]) {
        acc[key] = {
          jogo: item.jogo,
          time: item.time,
          items: [],
        }
      }
      acc[key].items.push(item)
      return acc
    }, {})
  }, [sumulas])

  const loadSumulas = useCallback(async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const data = await listSumulas({
        jogoId: filters.jogoId ? parseNumber(filters.jogoId) : undefined,
        time: filters.time || undefined,
        competicaoId: filters.competicaoId ? parseNumber(filters.competicaoId) : undefined,
      })
      setSumulas(Array.isArray(data) ? data : [])
    } catch (error) {
      setSumulas([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar as súmulas.' })
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const handleFilterChange = ({ target }) => {
    const { name, value } = target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleBatchChange = ({ target }) => {
    const { name, value } = target
    setBatch((prev) => ({ ...prev, [name]: value }))
  }

  const handleBatchCompetitionChange = (value) => {
    setBatch((prev) => ({ ...prev, competicao: value, categoria: '' }))
  }

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const handleAddPlayer = () => {
    setPlayers((prev) => [...prev, createEmptyPlayer()])
  }

  const handleRemovePlayer = (index) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateBatch = async (event) => {
    event.preventDefault()
    setBatchFeedback(null)

    if (!batch.jogoId || !batch.time) {
      setBatchFeedback({ type: 'danger', message: 'Informe o ID do jogo e o time.' })
      return
    }

    const validPlayers = players.filter((item) => item.nomeJogador?.trim())
    if (validPlayers.length === 0) {
      setBatchFeedback({ type: 'danger', message: 'Inclua ao menos um jogador na lista.' })
      return
    }

    const payload = validPlayers.map((item) => ({
      jogo: parseNumber(batch.jogoId),
      time: batch.time,
      nomeJogador: item.nomeJogador,
      categoria: batch.categoria || undefined,
      competicao: parseNumber(batch.competicao),
      arbitro: parseNumber(batch.arbitro),
      mesario: batch.mesario || undefined,
      cartaoAmarelo: parseNumber(item.cartaoAmarelo),
      cartaoVermelho: parseNumber(item.cartaoVermelho),
      gols: parseNumber(item.gols),
      capitao: parseNumber(item.capitao),
      tipoJogador: item.tipoJogador || undefined,
    }))

    setBatchLoading(true)
    try {
      await createSumulas(parseNumber(batch.jogoId), batch.time, payload)
      setBatchFeedback({ type: 'success', message: 'Súmulas criadas com sucesso.' })
      setBatch(createEmptyBatch())
      setPlayers([createEmptyPlayer()])
      await loadSumulas()
    } catch (error) {
      setBatchFeedback({ type: 'danger', message: 'Não foi possível cadastrar as súmulas.' })
    } finally {
      setBatchLoading(false)
    }
  }

  const handleEditChange = ({ target }) => {
    const { name, value } = target
    setEditSumula((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditCompetitionChange = (value) => {
    setEditSumula((prev) => ({ ...prev, competicao: value, categoria: '' }))
  }

  const handleStartEdit = (item) => {
    setEditFeedback(null)
    setEditSumula({
      ...item,
      jogo: item.jogo ?? '',
      time: item.time ?? '',
      competicao: item.competicao ?? '',
      categoria: item.categoria ?? '',
      arbitro: item.arbitro ?? '',
      mesario: item.mesario ?? '',
      cartaoAmarelo: item.cartaoAmarelo ?? '',
      cartaoVermelho: item.cartaoVermelho ?? '',
      gols: item.gols ?? '',
      capitao: item.capitao ?? '',
      tipoJogador: item.tipoJogador ?? '',
    })
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!editSumula?.id) return

    setEditLoading(true)
    setEditFeedback(null)
    try {
      const payload = {
        ...editSumula,
        id: parseNumber(editSumula.id),
        jogo: parseNumber(editSumula.jogo),
        competicao: parseNumber(editSumula.competicao),
        arbitro: parseNumber(editSumula.arbitro),
        cartaoAmarelo: parseNumber(editSumula.cartaoAmarelo),
        cartaoVermelho: parseNumber(editSumula.cartaoVermelho),
        gols: parseNumber(editSumula.gols),
        capitao: parseNumber(editSumula.capitao),
      }
      await updateSumula(editSumula.id, payload)
      setEditFeedback({ type: 'success', message: 'Súmula atualizada com sucesso.' })
      await loadSumulas()
    } catch (error) {
      setEditFeedback({ type: 'danger', message: 'Não foi possível atualizar a súmula.' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    setIsLoading(true)
    setFeedback(null)
    try {
      await deleteSumula(id)
      setFeedback({ type: 'success', message: 'Súmula removida.' })
      await loadSumulas()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover a súmula.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilCheck} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Súmulas</h4>
              <div className="text-medium-emphasis">
                Cadastre listas de jogadores por jogo e time, consulte e edite registros individuais.
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={6}>
        {feedback && (
          <CAlert color={feedback.type} className="mb-3">
            {feedback.message}
          </CAlert>
        )}
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Buscar súmulas</strong>
          </CCardHeader>
          <CCardBody>
            <CForm
              onSubmit={(event) => {
                event.preventDefault()
                loadSumulas()
              }}
              className="d-flex flex-column gap-3"
            >
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="filter-jogo">ID do jogo</CFormLabel>
                  <CFormInput
                    id="filter-jogo"
                    name="jogoId"
                    value={filters.jogoId}
                    onChange={handleFilterChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="filter-time">Time</CFormLabel>
                  <CFormInput
                    id="filter-time"
                    name="time"
                    value={filters.time}
                    onChange={handleFilterChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="filter-competicao">Competição</CFormLabel>
                  <CompetitionSelect
                    id="filter-competicao"
                    name="competicaoId"
                    label={null}
                    value={filters.competicaoId}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, competicaoId: value }))
                    }
                  />
                </CCol>
              </CRow>
              <div className="d-flex gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Carregando...' : 'Buscar'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setFilters({ jogoId: '', time: '', competicaoId: '' })
                    setSumulas([])
                  }}
                >
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {isLoading && (
          <div className="text-center text-medium-emphasis mb-3">
            <CSpinner size="sm" className="me-2" /> Carregando súmulas...
          </div>
        )}

        {!isLoading && Object.keys(groupedSumulas).length === 0 && (
          <div className="text-medium-emphasis">Nenhuma súmula encontrada.</div>
        )}

        {Object.entries(groupedSumulas).map(([key, group]) => (
          <CCard className="mb-3" key={key}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Jogo {group.jogo ?? '-'}</strong>
                <div className="small text-medium-emphasis">Time: {group.time ?? '-'}</div>
              </div>
              <div className="small text-medium-emphasis">{group.items.length} jogadores</div>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Jogador</CTableHeaderCell>
                    <CTableHeaderCell>Categoria</CTableHeaderCell>
                    <CTableHeaderCell>Gols</CTableHeaderCell>
                    <CTableHeaderCell>Amarelo</CTableHeaderCell>
                    <CTableHeaderCell>Vermelho</CTableHeaderCell>
                    <CTableHeaderCell>Capitão</CTableHeaderCell>
                    <CTableHeaderCell>Tipo</CTableHeaderCell>
                    <CTableHeaderCell>Ações</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {group.items.map((item) => (
                    <CTableRow key={item.id ?? `${item.nomeJogador}-${item.jogo}-${item.time}`}>
                      <CTableDataCell>{item.nomeJogador}</CTableDataCell>
                      <CTableDataCell>{item.categoria ?? '-'}</CTableDataCell>
                      <CTableDataCell>{item.gols ?? '-'}</CTableDataCell>
                      <CTableDataCell>{item.cartaoAmarelo ?? '-'}</CTableDataCell>
                      <CTableDataCell>{item.cartaoVermelho ?? '-'}</CTableDataCell>
                      <CTableDataCell>{item.capitao ?? '-'}</CTableDataCell>
                      <CTableDataCell>{item.tipoJogador ?? '-'}</CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton color="primary" size="sm" variant="outline" onClick={() => handleStartEdit(item)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        ))}
      </CCol>

      <CCol lg={6}>
        {batchFeedback && (
          <CAlert color={batchFeedback.type} className="mb-3">
            {batchFeedback.message}
          </CAlert>
        )}
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Cadastro em lote</strong>
            <div className="small text-medium-emphasis">Um jogo e time para todos os jogadores da lista.</div>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleCreateBatch} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel htmlFor="batch-jogo">ID do jogo</CFormLabel>
                  <CFormInput
                    id="batch-jogo"
                    name="jogoId"
                    value={batch.jogoId}
                    onChange={handleBatchChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="batch-time">Time</CFormLabel>
                  <CFormInput
                    id="batch-time"
                    name="time"
                    value={batch.time}
                    onChange={handleBatchChange}
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CompetitionSelect
                    id="batch-competicao"
                    name="competicao"
                    label="Competição"
                    value={batch.competicao}
                    onValueChange={handleBatchCompetitionChange}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={4}>
                  <CategorySelect
                    id="batch-categoria"
                    name="categoria"
                    label="Categoria"
                    competitionId={batch.competicao}
                    value={batch.categoria}
                    onValueChange={(value) => setBatch((prev) => ({ ...prev, categoria: value }))}
                    onError={(message) => setBatchFeedback({ type: 'danger', message })}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="batch-arbitro">Árbitro</CFormLabel>
                  <CFormInput
                    id="batch-arbitro"
                    name="arbitro"
                    value={batch.arbitro}
                    onChange={handleBatchChange}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel htmlFor="batch-mesario">Mesário</CFormLabel>
                  <CFormInput
                    id="batch-mesario"
                    name="mesario"
                    value={batch.mesario}
                    onChange={handleBatchChange}
                  />
                </CCol>
              </CRow>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Jogadores</strong>
                  <CButton color="primary" size="sm" variant="outline" onClick={handleAddPlayer}>
                    <CIcon icon={cilPlus} className="me-2" /> Adicionar
                  </CButton>
                </div>
                <div className="d-flex flex-column gap-3">
                  {players.map((player, index) => (
                    <CCard key={`player-${index}`} className="border">
                      <CCardBody className="d-flex flex-column gap-3">
                        <CRow className="g-3">
                          <CCol md={6}>
                            <CFormLabel>Nome do jogador</CFormLabel>
                            <CFormInput
                              value={player.nomeJogador}
                              onChange={({ target }) => handlePlayerChange(index, 'nomeJogador', target.value)}
                              required
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormLabel>Tipo do jogador</CFormLabel>
                            <CFormInput
                              value={player.tipoJogador}
                              onChange={({ target }) => handlePlayerChange(index, 'tipoJogador', target.value)}
                            />
                          </CCol>
                        </CRow>
                        <CRow className="g-3">
                          <CCol md={3}>
                            <CFormLabel>Gols</CFormLabel>
                            <CFormInput
                              type="number"
                              value={player.gols}
                              onChange={({ target }) => handlePlayerChange(index, 'gols', target.value)}
                            />
                          </CCol>
                          <CCol md={3}>
                            <CFormLabel>Cartão amarelo</CFormLabel>
                            <CFormInput
                              type="number"
                              value={player.cartaoAmarelo}
                              onChange={({ target }) => handlePlayerChange(index, 'cartaoAmarelo', target.value)}
                            />
                          </CCol>
                          <CCol md={3}>
                            <CFormLabel>Cartão vermelho</CFormLabel>
                            <CFormInput
                              type="number"
                              value={player.cartaoVermelho}
                              onChange={({ target }) => handlePlayerChange(index, 'cartaoVermelho', target.value)}
                            />
                          </CCol>
                          <CCol md={3}>
                            <CFormLabel>Capitão</CFormLabel>
                            <CFormInput
                              type="number"
                              value={player.capitao}
                              onChange={({ target }) => handlePlayerChange(index, 'capitao', target.value)}
                            />
                          </CCol>
                        </CRow>
                        <div className="d-flex justify-content-end">
                          <CButton
                            color="danger"
                            size="sm"
                            variant="ghost"
                            disabled={players.length === 1}
                            onClick={() => handleRemovePlayer(index)}
                          >
                            <CIcon icon={cilTrash} className="me-2" /> Remover jogador
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-2">
                <CButton color="primary" type="submit" disabled={batchLoading}>
                  <CIcon icon={cilSave} className="me-2" />
                  {batchLoading ? 'Salvando...' : 'Salvar lote'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setBatch(createEmptyBatch())
                    setPlayers([createEmptyPlayer()])
                    setBatchFeedback(null)
                  }}
                >
                  <CIcon icon={cilReload} className="me-2" /> Limpar
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {editSumula && (
          <CCard>
            <CCardHeader>
              <strong>Editar súmula</strong>
            </CCardHeader>
            <CCardBody>
              {editFeedback && (
                <CAlert color={editFeedback.type} className="mb-3">
                  {editFeedback.message}
                </CAlert>
              )}
              <CForm onSubmit={handleUpdate} className="d-flex flex-column gap-3">
                <CRow className="g-3">
                  <CCol md={4}>
                    <CFormLabel>ID</CFormLabel>
                    <CFormInput value={editSumula.id} readOnly />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Jogo</CFormLabel>
                    <CFormInput name="jogo" value={editSumula.jogo} onChange={handleEditChange} />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Time</CFormLabel>
                    <CFormInput name="time" value={editSumula.time} onChange={handleEditChange} />
                  </CCol>
                </CRow>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel>Jogador</CFormLabel>
                    <CFormInput
                      name="nomeJogador"
                      value={editSumula.nomeJogador}
                      onChange={handleEditChange}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Tipo do jogador</CFormLabel>
                    <CFormInput
                      name="tipoJogador"
                      value={editSumula.tipoJogador}
                      onChange={handleEditChange}
                    />
                  </CCol>
                </CRow>
                <CRow className="g-3">
                  <CCol md={4}>
                    <CFormLabel>Categoria</CFormLabel>
                    <CFormInput name="categoria" value={editSumula.categoria} onChange={handleEditChange} />
                  </CCol>
                  <CCol md={4}>
                    <CompetitionSelect
                      name="competicao"
                      label="Competição"
                      value={editSumula.competicao}
                      onValueChange={handleEditCompetitionChange}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Árbitro</CFormLabel>
                    <CFormInput name="arbitro" value={editSumula.arbitro} onChange={handleEditChange} />
                  </CCol>
                </CRow>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CategorySelect
                      name="categoria"
                      label="Categoria"
                      competitionId={editSumula.competicao}
                      value={editSumula.categoria}
                      onValueChange={(value) => setEditSumula((prev) => ({ ...prev, categoria: value }))}
                      onError={(message) => setEditFeedback({ type: 'danger', message })}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Mesário</CFormLabel>
                    <CFormInput name="mesario" value={editSumula.mesario} onChange={handleEditChange} />
                  </CCol>
                </CRow>
                <CRow className="g-3">
                  <CCol md={3}>
                    <CFormLabel>Gols</CFormLabel>
                    <CFormInput name="gols" value={editSumula.gols} onChange={handleEditChange} />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Cartão amarelo</CFormLabel>
                    <CFormInput name="cartaoAmarelo" value={editSumula.cartaoAmarelo} onChange={handleEditChange} />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Cartão vermelho</CFormLabel>
                    <CFormInput name="cartaoVermelho" value={editSumula.cartaoVermelho} onChange={handleEditChange} />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Capitão</CFormLabel>
                    <CFormInput name="capitao" value={editSumula.capitao} onChange={handleEditChange} />
                  </CCol>
                </CRow>
                <div className="d-flex gap-2">
                  <CButton color="primary" type="submit" disabled={editLoading}>
                    <CIcon icon={cilSave} className="me-2" />
                    {editLoading ? 'Salvando...' : 'Salvar alterações'}
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    onClick={() => setEditSumula(null)}
                  >
                    <CIcon icon={cilX} className="me-2" /> Fechar
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default SumulasCrud
