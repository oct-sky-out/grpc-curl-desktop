import React from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip, 
  CircularProgress,
  Alert
} from '@mui/material'
import { Upload, Description } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useGrpc } from '@/contexts/GrpcContext'
import { parseProtoFile } from '@/utils/protoParser'

const ProtoUpload: React.FC = () => {
  const { t } = useTranslation()
  const { 
    protoFile, 
    packageName,
    setProtoFile, 
    setPackageName,
    setServices,
    setMethods, 
    loading, 
    setLoading, 
    error, 
    setError 
  } = useGrpc()

  const handleFileSelect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const file = await window.electronAPI.selectProtoFile()
      
      if (file) {
        setProtoFile(file)
        
        // Parse the proto file and extract methods
        const protoInfo = await parseProtoFile(file.content, file.path)
        setPackageName(protoInfo.package)
        setServices(protoInfo.services)
        setMethods(protoInfo.methods)
      }
    } catch (err) {
      setError(t('proto.error'))
      console.error('Proto file parsing error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('proto.upload')}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
            onClick={handleFileSelect}
            disabled={loading}
          >
            {loading ? t('proto.parsing') : t('proto.selectFile')}
          </Button>
          
          {protoFile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              <Chip 
                label={protoFile.name} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          )}
        </Box>
        
        {packageName && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Package: <strong>{packageName}</strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ProtoUpload