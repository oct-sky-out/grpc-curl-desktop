import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@/i18n'

// ASCII Art console message
const asciiArt = `
  ____ ____   ____    ____           
 / ___|  _ \\|  _ \\ / ___|          
 | |  _| |_) | |_) | |              
 | |_| |  _ <|  __/| |____           
 \\____|_|_\\_\\_| ___\\__| ___      
  |  _ \\|  _ \\ / _ \\_   _/ _ \\     
  | |_) | |_) | | | || || | | |    
 _|  __/|  _ <| |_| || || |_| |    
(_) |_|_|_| \\_\\\\___/_|_| \\___/____ 
 / ___| |   |_ _| ____| \\ | |_   _|
| |   | |    | ||  _| |  \\| | | |  
| |___| |___ | || |___| |\\  | | |  
\\____|_____|___|_____|_| \\_| |_|   
`

const welcomeMessage = `
🚀 Welcome to GRPC Curl Desktop!

This is a powerful desktop gRPC client built with:
• Electron & React
• TypeScript & Vite
• Material-UI & i18next

Happy gRPC testing! 🎯
`

// Display ASCII art and welcome message
console.log('%c' + asciiArt, 'color: #1120a5ff; font-family: monospace; font-weight: bold;')
console.log('%c' + welcomeMessage, 'color: #0066cc; font-size: 14px; font-weight: bold;')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)