import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { ProtoMethod } from '@/types'
import { generateDummyJson } from '@/utils/protoParser'

interface JsonEditorProps {
  method: ProtoMethod | null
  value: string
  onChange: (value: string) => void
}

const JsonEditor: React.FC<JsonEditorProps> = ({ method, value, onChange }) => {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (method && method.requestFields) {
      const dummy = generateDummyJson(method.requestFields)
      onChange(JSON.stringify(dummy, null, 2))
    }
  }, [method, onChange])

  const handleGenerateDummy = () => {
    if (method && method.requestFields) {
      const dummy = generateDummyJson(method.requestFields)
      onChange(JSON.stringify(dummy, null, 2))
      setError(null)
    }
  }

  const handleChange = (newValue: string) => {
    onChange(newValue)
    
    // Validate JSON
    try {
      if (newValue.trim()) {
        JSON.parse(newValue)
      }
      setError(null)
    } catch (err) {
      setError('Invalid JSON format')
    }
  }

  if (!method) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('request.request')}
          </Typography>
          <Alert severity="info">
            Please select a method first
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {t('request.request')} - {method.name}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoAwesome />}
            onClick={handleGenerateDummy}
          >
            Generate Dummy
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          multiline
          rows={12}
          fullWidth
          variant="outlined"
          placeholder={t('request.placeholder')}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            },
          }}
        />
      </CardContent>
    </Card>
  )
}

export default JsonEditor