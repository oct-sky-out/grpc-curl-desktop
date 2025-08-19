import type { FC } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Container, Box } from '@mui/material'
import { theme } from './theme'
import Header from './components/Header'
import TabManager from './components/TabManager'
import ProtoUpload from './components/ProtoUpload'
import GrpcClient from './components/GrpcClient'
import ErrorToast from './components/ErrorToast'
import { LicenseButton } from './components/LicenseButton'
import { GrpcProvider } from './contexts/GrpcContext'

const App: FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GrpcProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Header />
          <TabManager />
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <ProtoUpload />
            <GrpcClient />
          </Container>
          <ErrorToast />
          <LicenseButton />
        </Box>
      </GrpcProvider>
    </ThemeProvider>
  )
}

export default App