import React, { useState } from 'react'
import { useSelector } from 'react-redux'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilSave, cilUser } from '@coreui/icons'
import { forgotPassword } from '../../../services/authApi'

const getResponseMessage = (response) => {
  if (!response || typeof response !== 'object') return ''

  return Object.values(response).find((value) => typeof value === 'string') ?? ''
}

const ChangePassword = () => {
  const user = useSelector((state) => state.auth?.user)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const userId = Number(user?.id)
  const hasUserId = Number.isInteger(userId) && userId > 0
  const displayName = user?.name || user?.username || 'Usuário logado'

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!hasUserId) {
      setFeedback({
        type: 'danger',
        message: 'Não foi possível identificar o usuário da sessão logada.',
      })
      return
    }

    if (!password) {
      setFeedback({ type: 'danger', message: 'Informe a nova senha.' })
      return
    }

    if (password !== passwordConfirmation) {
      setFeedback({ type: 'danger', message: 'A confirmação deve ser igual à nova senha.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const response = await forgotPassword({ id: userId, password })
      setPassword('')
      setPasswordConfirmation('')
      setFeedback({
        type: 'success',
        message: getResponseMessage(response) || 'Senha alterada com sucesso.',
      })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Não foi possível alterar a senha.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilLockLocked} size="xl" className="text-primary" />
            <div>
              <h4 className="mb-1">Mudar Senha</h4>
              <div className="text-medium-emphasis">Atualização de senha do usuário.</div>
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

      <CCol lg={8} xl={6}>
        <CCard>
          <CCardHeader>
            <strong>Nova senha</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <CFormLabel htmlFor="change-password-user">Usuário</CFormLabel>
                <CFormInput
                  id="change-password-user"
                  value={`${displayName}${hasUserId ? ` (#${userId})` : ''}`}
                  disabled
                />
              </div>

              <div>
                <CFormLabel htmlFor="change-password-password">Nova senha</CFormLabel>
                <CFormInput
                  id="change-password-password"
                  type="password"
                  value={password}
                  onChange={({ target }) => setPassword(target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <CFormLabel htmlFor="change-password-confirmation">Confirmar nova senha</CFormLabel>
                <CFormInput
                  id="change-password-confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={({ target }) => setPasswordConfirmation(target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <CButton color="primary" type="submit" disabled={isSaving || !hasUserId}>
                  {isSaving ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : (
                    <CIcon icon={cilSave} className="me-2" />
                  )}
                  {isSaving ? 'Alterando...' : 'Alterar senha'}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg={4} xl={3}>
        <CCard>
          <CCardBody className="d-flex align-items-center gap-3">
            <CIcon icon={cilUser} size="lg" className="text-medium-emphasis" />
            <div className="text-medium-emphasis">
              A alteração será aplicada ao usuário identificado na sessão atual.
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ChangePassword
