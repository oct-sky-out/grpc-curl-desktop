import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Alert,
} from '@mui/material'
import { Api } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { ProtoMethod } from '@/types'

interface MethodListProps {
  methods: ProtoMethod[]
  selectedMethod: ProtoMethod | null
  onMethodSelect: (method: ProtoMethod) => void
}

const MethodList: React.FC<MethodListProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
}) => {
  const { t } = useTranslation()
  
  // Debug logging
  console.log('MethodList methods:', methods)

  if (methods.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('proto.methods')}
          </Typography>
          <Alert severity="info">{t('proto.noMethods')}</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('proto.methods')}
        </Typography>
        <List dense>
          {methods.map((method, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                selected={selectedMethod?.name === method.name}
                onClick={() => onMethodSelect(method)}
              >
                <ListItemIcon>
                  <Api />
                </ListItemIcon>
                <ListItemText
                  primary={method.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexDirection: "column" }}>
                      <Chip
                        label={method.service || 'Unknown'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${method.inputType || 'Unknown'} → ${method.outputType || 'Unknown'}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default MethodList