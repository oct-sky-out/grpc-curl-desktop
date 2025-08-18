import React from 'react'
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
} from '@mui/material'
import { Close, Add } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useGrpc } from '@/contexts/GrpcContext'

const TabManager: React.FC = () => {
  const { t } = useTranslation()
  const { tabs, activeTabId, setActiveTab, addTab, closeTab } = useGrpc()

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleCloseTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    closeTab(tabId)
  }

  const handleAddTab = () => {
    addTab()
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={activeTabId}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                    {t('tabs.tab')} {tab.title}
                  </Typography>
                  {tabs.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      sx={{ 
                        p: 0.25, 
                        ml: 0.5,
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          borderRadius: '50%'
                        }
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
              sx={{ 
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              }}
            />
          ))}
        </Tabs>
        <IconButton 
          onClick={handleAddTab}
          size="small"
          sx={{ 
            mx: 1,
            border: 1,
            borderColor: 'divider',
            '&:hover': { 
              bgcolor: 'action.hover' 
            }
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}

export default TabManager