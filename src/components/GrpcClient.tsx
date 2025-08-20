import React, { useState, useMemo, useEffect } from 'react'
import { Grid, Box, TextField, Button, Alert, Chip } from '@mui/material'
import { Send, FolderOpen } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useGrpc } from '@/contexts/GrpcContext'
import MethodList from './MethodList'
import JsonEditor from './JsonEditor'
import ResponseViewer from './ResponseViewer'
import FavoriteEndpoints from './FavoriteEndpoints'
import { ProtoMethod, GrpcRequest } from '@/types'
import { GrpcClient as GrpcClientUtil } from '@/utils/grpcClient'

const GrpcClient: React.FC = () => {
  const { t } = useTranslation()
  const {
    protoFile,
    methods,
    loading: contextLoading,
    response,
    setResponse,
    setError,
    currentTab,
    updateTab,
  } = useGrpc()

  const [requestLoading, setRequestLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [includeDirs, setIncludeDirs] = useState<string[]>([])
  const grpcClient = useMemo(() => 
    new GrpcClientUtil(currentTab?.id || 'default'), 
    [currentTab?.id]
  )

  // Update includeDirs in backend when they change
  useEffect(() => {
    if (currentTab?.id && includeDirs.length > 0) {
      window.electronAPI.grpc.setIncludeDirs(currentTab.id, includeDirs)
        .catch(error => console.error('Failed to set include dirs:', error))
    }
  }, [currentTab?.id, includeDirs])

  // Use tab-specific data
  const selectedMethod = currentTab?.selectedMethod || null
  const requestData = currentTab?.requestData || '{}'

  // Update tab when method is selected
  const handleMethodSelect = (method: ProtoMethod) => {
    if (currentTab) {
      updateTab(currentTab.id, { 
        selectedMethod: method,
        response: null 
      })
    }
    setCopySuccess(false)
  }

  // Update tab when request data changes
  const handleRequestDataChange = (data: string) => {
    if (currentTab) {
      updateTab(currentTab.id, { requestData: data })
    }
  }

  const handleSelectIncludeDirs = async () => {
    try {
      const result = await window.electronAPI.selectIncludeDirs()
      if (result && result.length > 0) {
        setIncludeDirs(result)
      }
    } catch (error) {
      setError(t('request.failedToSelectIncludeDirs'))
    }
  }

  const handleSendRequest = async () => {
    if (!selectedMethod || !protoFile || !requestData.trim()) {
      setError(t('request.selectMethodAndData'))
      return
    }

    setRequestLoading(true)
    setResponse(null)
    setCopySuccess(false)
    
    try {
      // Parse request data
      let data
      try {
        data = JSON.parse(requestData)
      } catch (parseError) {
        setResponse({
          data: null,
          error: t('request.invalidJsonError', { 
            message: parseError instanceof Error ? parseError.message : t('request.checkJsonSyntax')
          }),
          status: 'ERROR',
        })
        return
      }
      
      
      // Load proto file into gRPC client
      await grpcClient.loadProto(protoFile.path)
      
      // Create client for the service
      const endpointUrl = currentTab?.endpoint || 'localhost:50051'
      console.log('Creating client for endpoint:', endpointUrl, 'service:', selectedMethod.service)
      await grpcClient.createClient(endpointUrl, selectedMethod.service)
      
      // Make the gRPC request
      const grpcRequest: GrpcRequest = {
        method: selectedMethod,
        endpoint: endpointUrl,
        data,
      }
      
      const result = await grpcClient.makeRequest(grpcRequest)
      setResponse(result)
      
    } catch (error) {
      setResponse({
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'ERROR',
      })
    } finally {
      setRequestLoading(false)
    }
  }

  const handleCopyResponse = async () => {
    if (!response) return
    
    const content = response.error 
      ? response.error 
      : JSON.stringify(response.data, null, 2)
    
    try {
      await window.electronAPI.copyToClipboard(content)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      setError(t('request.failedToCopyToClipboard'))
    }
  }

  if (!protoFile) {
    return (
      <Alert severity="info">
        {t('request.uploadProtoFirst')}
      </Alert>
    )
  }

  return (
    <Box>
      <FavoriteEndpoints />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MethodList
            methods={methods}
            selectedMethod={selectedMethod}
            onMethodSelect={handleMethodSelect}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FolderOpen />}
              onClick={handleSelectIncludeDirs}
              size="small"
            >
              {t('request.includeDirectories')} ({includeDirs.length})
            </Button>
            {includeDirs.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {includeDirs.map((dir, index) => (
                  <Chip
                    key={index}
                    label={dir.split('/').pop()}
                    size="small"
                    onDelete={() => {
                      setIncludeDirs(dirs => dirs.filter((_, i) => i !== index))
                    }}
                    title={dir}
                  />
                ))}
              </Box>
            )}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t('request.endpoint')}
              value={currentTab?.endpoint || ''}
              onChange={(e) => currentTab && updateTab(currentTab.id, { endpoint: e.target.value })}
              placeholder="localhost:50051"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSendRequest}
              disabled={!selectedMethod || requestLoading || contextLoading}
              fullWidth
              size="large"
            >
              {requestLoading ? t('common.loading') : t('request.send')}
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <JsonEditor
            method={selectedMethod}
            value={requestData}
            onChange={handleRequestDataChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ResponseViewer
            response={response}
            loading={requestLoading}
            onCopy={handleCopyResponse}
            copySuccess={copySuccess}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default GrpcClient