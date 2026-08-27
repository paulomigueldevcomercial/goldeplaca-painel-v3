import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilSave, cilTrash, cilUser } from '@coreui/icons'
import ListPagination from '../../components/ListPagination'
import {
  createUsuario,
  deleteUsuario,
  getUsuario,
  listUsuarios,
  updateUsuario,
} from '../../services/usuariosApi'
import { MENU_ALLOWED_GROUPS, MENU_ALLOWED_OPTIONS } from '../../config/menusAllowed'
import { normalizeMenusAllowed } from '../../utils/authSession'

const ROLE_OPTIONS = ['admin', 'user', 'apcef', 'oab', 'bancarios']

const createEmptyUser = () => ({
  name: '',
  username: '',
  password: '',
  roles: '',
  menusAllowed: '',
})

const normalizeText = (value) => {
  const text = String(value ?? '').trim()
  return text || undefined
}

const serializeMenusAllowed = (value) => normalizeMenusAllowed(value).join(',')

const UsuariosCrud = () => {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState(createEmptyUser())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listUsuarios()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setUsers([])
      setFeedback({ type: 'danger', message: 'Não foi possível carregar os usuários.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadUsers)
  }, [loadUsers])

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) =>
      [user.name, user.username, user.id?.toString()].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [search, users])

  const selectedMenuAliases = useMemo(
    () => normalizeMenusAllowed(formData.menusAllowed),
    [formData.menusAllowed],
  )

  const menuOptionsByAlias = useMemo(
    () =>
      MENU_ALLOWED_OPTIONS.reduce((optionsByAlias, option) => {
        optionsByAlias[option.alias] = option
        return optionsByAlias
      }, {}),
    [],
  )

  const handleSelectUser = async (id) => {
    if (!id) return
    setFeedback(null)
    setSelectedUserId(id)
    setIsLoading(true)

    try {
      const user = await getUsuario(id)
      setFormData({
        name: user?.name ?? '',
        username: user?.username ?? '',
        password: '',
        roles: user?.roles ?? '',
        menusAllowed: serializeMenusAllowed(user?.menusAllowed),
      })
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível carregar o usuário selecionado.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleMenuAllowedChange = ({ target }) => {
    const { checked, value } = target

    setFormData((previous) => {
      const selectedAliases = new Set(normalizeMenusAllowed(previous.menusAllowed))

      if (checked) {
        selectedAliases.add(value)
      } else {
        selectedAliases.delete(value)
      }

      return {
        ...previous,
        menusAllowed: MENU_ALLOWED_OPTIONS.map((option) => option.alias)
          .filter((alias) => selectedAliases.has(alias))
          .join(','),
      }
    })
  }

  const handleReset = () => {
    setSelectedUserId(null)
    setFormData(createEmptyUser())
    setFeedback(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name || !formData.username) {
      setFeedback({ type: 'danger', message: 'Preencha os campos obrigatórios de usuário.' })
      return
    }

    if (!formData.roles) {
      setFeedback({ type: 'danger', message: 'Selecione uma role para o usuário.' })
      return
    }

    if (!formData.menusAllowed) {
      setFeedback({ type: 'danger', message: 'Selecione ao menos um menu para o usuário.' })
      return
    }

    if (!selectedUserId && !formData.password) {
      setFeedback({ type: 'danger', message: 'Informe a senha para cadastrar um novo usuário.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const payload = {
        name: normalizeText(formData.name),
        username: normalizeText(formData.username),
        roles: normalizeText(formData.roles),
        menusAllowed: serializeMenusAllowed(formData.menusAllowed),
      }

      const password = normalizeText(formData.password)
      if (password) {
        payload.password = password
      }

      if (selectedUserId) {
        await updateUsuario(selectedUserId, payload)
        setFeedback({ type: 'success', message: 'Usuário atualizado com sucesso.' })
      } else {
        const created = await createUsuario(payload)
        setSelectedUserId(created?.id ?? null)
        setFeedback({ type: 'success', message: 'Usuário cadastrado com sucesso.' })
      }

      await loadUsers()
      setFormData((previous) => ({
        ...previous,
        password: '',
      }))
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível salvar o usuário.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUserId) return

    setIsLoading(true)
    try {
      await deleteUsuario(selectedUserId)
      setFeedback({ type: 'success', message: 'Usuário removido com sucesso.' })
      setSelectedUserId(null)
      setFormData(createEmptyUser())
      await loadUsers()
    } catch (error) {
      setFeedback({ type: 'danger', message: 'Não foi possível remover o usuário.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilUser} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Usuários</h4>
              <div className="text-medium-emphasis">Gerenciamento de usuários do painel.</div>
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
          <CCardHeader>
            <strong>Usuários cadastrados</strong>
          </CCardHeader>
          <CCardBody className="p-0">
            <div className="p-3 border-bottom">
              <CFormInput
                type="search"
                value={search}
                onChange={({ target }) => setSearch(target.value)}
                placeholder="Pesquisar por nome, username ou ID"
                aria-label="Pesquisar usuários"
              />
            </div>

            {isLoading ? (
              <div className="p-3 text-center text-medium-emphasis">
                <CSpinner size="sm" className="me-2" />
                Carregando usuários...
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="p-3 text-medium-emphasis">Nenhum usuário cadastrado.</div>
            ) : (
              <ListPagination items={visibleUsers} summaryLabel="usuários">
                {(paginatedUsers) => (
                  <CListGroup flush>
                    {paginatedUsers.map((user) => (
                      <CListGroupItem
                        key={user.id}
                        action
                        active={String(user.id) === String(selectedUserId)}
                        onClick={() => handleSelectUser(user.id)}
                      >
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div className="text-truncate">
                            {user.name || user.username || `Usuário ${user.id}`}
                          </div>
                          <span className="small text-medium-emphasis">#{user.id ?? '-'}</span>
                        </div>
                        <div className="small text-medium-emphasis">{user.username ?? '-'}</div>
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
            <strong>{selectedUserId ? 'Editar usuário' : 'Novo usuário'}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <CRow className="g-3">
                <CCol md={12}>
                  <CFormLabel htmlFor="usuario-name">Nome</CFormLabel>
                  <CFormInput
                    id="usuario-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="usuario-username">Username</CFormLabel>
                  <CFormInput
                    id="usuario-username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="usuario-password">Senha</CFormLabel>
                  <CFormInput
                    id="usuario-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={selectedUserId ? 'Preencha para alterar' : ''}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="usuario-roles">Roles</CFormLabel>
                  <CFormSelect
                    id="usuario-roles"
                    name="roles"
                    value={formData.roles}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione uma role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                <CCol xs={12}>
                  <CFormLabel>Menus permitidos</CFormLabel>
                  <div className="d-flex flex-column gap-3">
                    {MENU_ALLOWED_GROUPS.map((group) => (
                      <div key={group.label}>
                        <div className="fw-semibold mb-2">{group.label}</div>
                        <CRow className="g-2">
                          {group.aliases.map((alias) => {
                            const option = menuOptionsByAlias[alias]
                            if (!option) return null

                            return (
                              <CCol sm={6} lg={4} key={option.alias}>
                                <CFormCheck
                                  id={`usuario-menu-${option.alias}`}
                                  label={option.menu}
                                  value={option.alias}
                                  checked={selectedMenuAliases.includes(option.alias)}
                                  onChange={handleMenuAllowedChange}
                                />
                              </CCol>
                            )
                          })}
                        </CRow>
                      </div>
                    ))}
                  </div>
                </CCol>
              </CRow>

              <div className="d-flex gap-2">
                <CButton color="primary" type="submit" disabled={isSaving}>
                  <CIcon icon={cilSave} className="me-2" />
                  {isSaving
                    ? selectedUserId
                      ? 'Atualizando...'
                      : 'Salvando...'
                    : selectedUserId
                      ? 'Atualizar'
                      : 'Salvar'}
                </CButton>
                <CButton color="secondary" variant="outline" type="button" onClick={handleReset}>
                  <CIcon icon={cilReload} className="me-2" />
                  Novo
                </CButton>
                {selectedUserId && (
                  <CButton color="danger" variant="ghost" type="button" onClick={handleDelete}>
                    <CIcon icon={cilTrash} className="me-2" />
                    Excluir
                  </CButton>
                )}
                <CButton color="success" variant="outline" type="button" onClick={loadUsers}>
                  <CIcon icon={cilReload} className="me-2" />
                  Recarregar
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default UsuariosCrud
