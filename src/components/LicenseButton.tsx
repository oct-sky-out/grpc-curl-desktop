import React, { useState } from 'react'
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'

const thirdPartyLicenses = [
  { name: '@emotion/react', version: '^11.11.4', license: 'MIT', author: 'Emotion team' },
  { name: '@emotion/styled', version: '^11.11.5', license: 'MIT', author: 'Emotion team' },
  { name: '@grpc/grpc-js', version: '^1.10.9', license: 'Apache-2.0', author: 'The gRPC Authors' },
  { name: '@grpc/proto-loader', version: '^0.7.13', license: 'Apache-2.0', author: 'The gRPC Authors' },
  { name: '@mui/icons-material', version: '^5.16.0', license: 'MIT', author: 'MUI Team' },
  { name: '@mui/material', version: '^5.16.0', license: 'MIT', author: 'MUI Team' },
  { name: '@protobufjs/inquire', version: '^1.1.0', license: 'BSD-3-Clause', author: 'Daniel Wirtz' },
  { name: 'i18next', version: '^23.11.5', license: 'MIT', author: 'i18next' },
  { name: 'protobufjs', version: '^7.3.2', license: 'BSD-3-Clause', author: 'Daniel Wirtz' },
  { name: 'react', version: '^18.3.1', license: 'MIT', author: 'Meta Platforms, Inc.' },
  { name: 'react-dom', version: '^18.3.1', license: 'MIT', author: 'Meta Platforms, Inc.' },
  { name: 'react-i18next', version: '^14.1.2', license: 'MIT', author: 'i18next' },
  { name: 'react-json-editor-ajrm', version: '^2.5.14', license: 'MIT', author: 'Andrew Redican' },
  { name: 'electron', version: '^31.7.7', license: 'MIT', author: 'GitHub Inc.' },
  { name: 'typescript', version: '^5.5.3', license: 'Apache-2.0', author: 'Microsoft Corp.' },
  { name: 'vite', version: '^5.3.4', license: 'MIT', author: 'Evan You' }
]

export const LicenseButton: React.FC = () => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <>
      <Fab
        size="small"
        color="default"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }
        }}
      >
        <InfoIcon fontSize="small" />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          Open Source Licenses
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This application uses the following open source libraries:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {thirdPartyLicenses.map((lib, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {lib.name} {lib.version}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  License: {lib.license}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Copyright: {lib.author}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2">
              For full license texts, please visit the respective repositories or check the
              <Link 
                href="#" 
                onClick={async (e) => {
                  e.preventDefault()
                  if (window.electronAPI?.shell?.openExternal) {
                    try {
                      await window.electronAPI.shell.openExternal("https://github.com/your-repo/grpc-curl-desktop")
                    } catch (error) {
                      console.error('Error opening external link:', error)
                    }
                  } else {
                    console.error('shell.openExternal not available')
                  }
                }}
              >
                project repository
              </Link>.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}