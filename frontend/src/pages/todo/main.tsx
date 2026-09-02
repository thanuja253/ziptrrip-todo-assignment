import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DetailPage } from './DetailPage'
import '../../shared/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DetailPage />
  </StrictMode>,
)
