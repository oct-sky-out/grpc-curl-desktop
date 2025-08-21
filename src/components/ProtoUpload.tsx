import React, { useState } from 'react'
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
import { Upload, Description, Settings } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useGrpc } from '@/contexts/GrpcContext'
import { parseProtoFile } from '@/utils/protoParser'
import ProjectSetup from './ProjectSetup'

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
    setError,
    currentTab 
  } = useGrpc()

  const [showProjectSetup, setShowProjectSetup] = useState(false)
  const [includeDirsSet, setIncludeDirsSet] = useState(false)

  const handleSetupIncludePaths = () => {
    setShowProjectSetup(true)
  }

  const handleProjectSetupComplete = async (includeDirs: string[]) => {
    if (currentTab) {
      // Set include directories for current tab (even if empty array for skip)
      await window.electronAPI.grpc.setIncludeDirs(currentTab.id, includeDirs)
      setIncludeDirsSet(true)
      
      if (includeDirs.length > 0) {
        console.log('Include directories set:', includeDirs)
      } else {
        console.log('Include directories setup skipped')
      }
    }
  }

  const handleFileSelect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const file = await window.electronAPI.selectProtoFile()
      
      if (file) {
        setProtoFile(file)
        
        // Parse the proto file and extract methods, passing tabId for include path resolution
        const protoInfo = await parseProtoFile(file.content, file.path, currentTab?.id)
        setPackageName(protoInfo.package)
        setServices(protoInfo.services)
        setMethods(protoInfo.methods)
      }
    } catch (err: any) {
      console.error('Proto file parsing error:', err)
      
      // Check if the error is related to import resolution
      const errorMessage = err?.message || ''
      if (errorMessage.includes('import') || errorMessage.includes('not found') || errorMessage.includes('resolve')) {
        setError(t('proto.importError', 'Failed to resolve imports. Please setup include directories first.'))
      } else {
        setError(t('proto.error', 'Failed to parse proto file'))
      }
      
      // Reset proto file on error
      setProtoFile(null)
    } finally {
      setLoading(false)
    }
  }

  // Show setup button if no include dirs are set and no proto file is loaded
  const showSetupButton = !includeDirsSet && !protoFile

  return (
    <>
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

          {showSetupButton && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {t('proto.setupRequired', 'Setup include paths first if your .proto files have imports')}
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {showSetupButton && (
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={handleSetupIncludePaths}
                sx={{ mb: 1 }}
              >
                {t('proto.setupIncludePaths', 'Setup Include Paths')}
              </Button>
            )}

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

            {includeDirsSet && !protoFile && (
              <Chip 
                label={t('proto.includePathsSet', 'Include paths configured')} 
                color="success" 
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {!showSetupButton && !protoFile && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="text"
                startIcon={<Settings />}
                onClick={handleSetupIncludePaths}
                size="small"
              >
                {t('proto.reconfigureIncludePaths', 'Reconfigure Include Paths')}
              </Button>
            </Box>
          )}
          
          {packageName && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Package: <strong>{packageName}</strong>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <ProjectSetup
        open={showProjectSetup}
        onClose={() => setShowProjectSetup(false)}
        onComplete={handleProjectSetupComplete}
      />
    </>
  )
}

export default ProtoUpload