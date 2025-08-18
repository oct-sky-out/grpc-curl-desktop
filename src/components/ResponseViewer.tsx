import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { ContentCopy, CheckCircle } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { GrpcResponse } from '@/types'

interface ResponseViewerProps {
  response: GrpcResponse | null
  loading: boolean
  onCopy: () => void
  copySuccess: boolean
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  loading,
  onCopy,
  copySuccess,
}) => {
  const { t } = useTranslation()

  const getResponseContent = () => {
    if (!response) return ''
    if (response.error) return response.error
    return JSON.stringify(response.data, null, 2)
  }

  const getResponseSeverity = (): 'success' | 'error' | 'info' => {
    if (!response) return 'info'
    return response.error ? 'error' : 'success'
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {t('request.response')}
          </Typography>
          {response && (
            <Button
              variant="outlined"
              size="small"
              startIcon={copySuccess ? <CheckCircle /> : <ContentCopy />}
              onClick={onCopy}
              color={copySuccess ? 'success' : 'primary'}
              disabled={loading}
            >
              {copySuccess ? t('request.copied') : t('request.copy')}
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && response && (
          <Alert severity={getResponseSeverity()} sx={{ mb: 2 }}>
            Status: {response.status || (response.error ? 'ERROR' : 'SUCCESS')}
          </Alert>
        )}

        <TextField
          multiline
          rows={12}
          fullWidth
          variant="outlined"
          value={loading ? t('common.loading') : getResponseContent()}
          InputProps={{
            readOnly: true,
            style: {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            },
          }}
          placeholder="Response will appear here..."
        />
      </CardContent>
    </Card>
  )
}

export default ResponseViewer