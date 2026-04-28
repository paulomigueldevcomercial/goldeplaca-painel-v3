import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <CFooter className="px-4">
      <div className="ms-auto">
        <span className="me-1">Desenvolvido por</span>
        <a href="https://coreui.io/react" target="_blank" rel="noopener noreferrer">
          Gol de Placa MA <span className="ms-1">&copy; {currentYear}</span>
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
