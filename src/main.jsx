import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupServiceWorker } from './pwa.js'

setupServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(

      <App />
  
)
