import React from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useGrpc } from '@/contexts/GrpcContext'

const ErrorToast: React.FC = () => {
  const { error, setError } = useGrpc()

  const handleClose = () => {
    setError(null)
  }

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity="error" variant="filled">
        {error}
      </Alert>
    </Snackbar>
  )
}

export default ErrorToast