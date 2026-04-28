import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { login } from '../../../services/authApi'
import { buildSessionFromLogin, saveSession } from '../../../utils/authSession'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = ({ target }) => {
    const { name, value } = target
    setCredentials((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setIsSubmitting(true)

    try {
      const response = await login(credentials)
      const session = buildSessionFromLogin(response, credentials)

      saveSession(session)
      dispatch({
        type: 'set',
        auth: {
          isAuthenticated: true,
          token: session.token,
          user: session.user,
        },
        selectedCompetitionId: session.user?.competicaoId || '',
      })

      const redirectTo = location.state?.from?.pathname || '/painel'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Não foi possível autenticar com as credenciais informadas.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Autenticação</h1>
                    <p className="text-body-secondary">Acesse o painel administrativo.</p>
                    {feedback ? <CAlert color={feedback.type}>{feedback.message}</CAlert> : null}
                    <CFormLabel htmlFor="username">Usuário</CFormLabel>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="username"
                        name="username"
                        value={credentials.username}
                        onChange={handleInputChange}
                        placeholder="Digite seu usuário"
                        autoComplete="username"
                        disabled={isSubmitting}
                        required
                      />
                    </CInputGroup>
                    <CFormLabel htmlFor="password">Senha</CFormLabel>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="password"
                        name="password"
                        type="password"
                        value={credentials.password}
                        onChange={handleInputChange}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        required
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <CSpinner size="sm" /> : 'Entrar'}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Painel administrativo</h2>
                    <p>Gerenciamento do site Gol de Placa MA.</p>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
