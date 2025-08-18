import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  Tooltip,
} from '@mui/material'
import { 
  Star, 
  Delete, 
  ContentCopy, 
  Add,
  Launch
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useGrpc } from '@/contexts/GrpcContext'

const FavoriteEndpoints: React.FC = () => {
  const { t } = useTranslation()
  const { 
    favoriteEndpoints, 
    addFavoriteEndpoint, 
    removeFavoriteEndpoint,
    currentTab,
    updateTab
  } = useGrpc()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEndpointName, setNewEndpointName] = useState('')
  const [newEndpointUrl, setNewEndpointUrl] = useState('')

  const handleAddFavorite = () => {
    if (newEndpointName.trim() && newEndpointUrl.trim()) {
      addFavoriteEndpoint(newEndpointName.trim(), newEndpointUrl.trim())
      setNewEndpointName('')
      setNewEndpointUrl('')
      setDialogOpen(false)
    }
  }

  const handleCopyEndpoint = async (url: string) => {
    try {
      await window.electronAPI.copyToClipboard(url)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleLoadEndpoint = (endpoint: any) => {
    if (currentTab) {
      updateTab(currentTab.id, { endpoint: endpoint.url })
    }
  }

  const handleAddCurrentEndpoint = () => {
    if (currentTab?.endpoint) {
      setNewEndpointUrl(currentTab.endpoint)
      setDialogOpen(true)
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('favorites.title')}
          </Typography>
          <Box>
            {currentTab?.endpoint && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={handleAddCurrentEndpoint}
                sx={{ mr: 1 }}
              >
                {t('favorites.addCurrent')}
              </Button>
            )}
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
            >
              {t('favorites.addNew')}
            </Button>
          </Box>
        </Box>

        {favoriteEndpoints.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('favorites.noEndpoints')}
          </Typography>
        ) : (
          <List dense>
            {favoriteEndpoints.map((endpoint) => (
              <ListItem 
                key={endpoint.id} 
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {endpoint.name}
                      </Typography>
                      <Chip 
                        label={endpoint.url} 
                        size="small" 
                        variant="outlined"
                        sx={{ maxWidth: 300 }}
                      />
                    </Box>
                  }
                  secondary={`${t('favorites.addedDate')}: ${new Date(endpoint.createdAt).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={t('favorites.loadEndpoint')}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleLoadEndpoint(endpoint)}
                      >
                        <Launch fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('favorites.copyUrl')}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyEndpoint(endpoint.url)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('favorites.delete')}>
                      <IconButton 
                        size="small" 
                        onClick={() => removeFavoriteEndpoint(endpoint.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('favorites.addEndpointTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('favorites.endpointName')}
            fullWidth
            variant="outlined"
            value={newEndpointName}
            onChange={(e) => setNewEndpointName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('favorites.endpointUrl')}
            fullWidth
            variant="outlined"
            value={newEndpointUrl}
            onChange={(e) => setNewEndpointUrl(e.target.value)}
            placeholder="localhost:9090"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleAddFavorite} 
            variant="contained"
            disabled={!newEndpointName.trim() || !newEndpointUrl.trim()}
          >
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default FavoriteEndpoints