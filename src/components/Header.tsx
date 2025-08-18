import React from 'react'
import { AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem } from '@mui/material'
import { Language } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleLanguageClose = () => {
    setAnchorEl(null)
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    handleLanguageClose()
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ mr: 1, opacity: 0.8 }}>
            {t('app.subtitle')}
          </Typography>
          <IconButton color="inherit" onClick={handleLanguageClick}>
            <Language />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleLanguageClose}
          >
            <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
            <MenuItem onClick={() => changeLanguage('ja')}>日本語</MenuItem>
            <MenuItem onClick={() => changeLanguage('ko')}>한국어</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header