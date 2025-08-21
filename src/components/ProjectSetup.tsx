import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import { FolderOpen, Delete, Info } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface ProjectSetupProps {
  open: boolean
  onClose: () => void
  onComplete: (includeDirs: string[]) => void
}

const ProjectSetup: React.FC<ProjectSetupProps> = ({ open, onClose, onComplete }) => {
  const { t } = useTranslation()
  const [includeDirs, setIncludeDirs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSelectDirectories = async () => {
    setLoading(true)
    try {
      const directories = await window.electronAPI.selectIncludeDirs()
      if (directories && directories.length > 0) {
        setIncludeDirs(prev => [...prev, ...directories.filter(dir => !prev.includes(dir))])
      }
    } catch (error) {
      console.error('Failed to select directories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDirectory = (dirToRemove: string) => {
    setIncludeDirs(prev => prev.filter(dir => dir !== dirToRemove))
  }

  const handleSkip = () => {
    onComplete([])
    onClose()
  }

  const handleContinue = () => {
    onComplete(includeDirs)
    onClose()
  }

  const handleClose = () => {
    setIncludeDirs([])
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FolderOpen />
        {t('project.setup.title', 'Project Setup')}
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Info />
            <Typography variant="subtitle2">
              {t('project.setup.info.title', 'Why setup include directories?')}
            </Typography>
          </Box>
          <Typography variant="body2">
            {t('project.setup.info.description', 
              'If your .proto files import other .proto files from different directories, ' +
              'you need to specify those directories so they can be resolved correctly.'
            )}
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom>
          {t('project.setup.includeDirectories', 'Include Directories')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('project.setup.includeDirectories.description', 
            'Select directories that contain .proto files that might be imported by your main .proto file.'
          )}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<FolderOpen />}
            onClick={handleSelectDirectories}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {t('project.setup.addDirectory', 'Add Include Directory')}
          </Button>

          {includeDirs.length > 0 && (
            <List dense>
              {includeDirs.map((dir, index) => (
                <ListItem key={index} divider>
                  <ListItemText 
                    primary={dir}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { wordBreak: 'break-all' }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveDirectory(dir)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {includeDirs.length === 0 && (
            <Box 
              sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                p: 3, 
                textAlign: 'center',
                bgcolor: 'action.hover'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('project.setup.noDirectories', 'No include directories selected')}
              </Typography>
            </Box>
          )}
        </Box>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            {t('project.setup.canSkip', 
              'If your .proto file doesn\'t import anything or all imports are in the same directory, ' +
              'you can skip this step.'
            )}
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleSkip} variant="outlined">
          {t('project.setup.skip', 'Skip')}
        </Button>
        <Button 
          onClick={handleContinue} 
          variant="contained"
          disabled={loading}
        >
          {t('project.setup.continue', 'Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProjectSetup