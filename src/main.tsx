import { App } from '@/app'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from 'oidc-react'
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'

import '@/index.css'
const config = {
  "CLIENT_ID": "zfGb71fg6imMgX6OfWfABVlzM7e3xKCt8HMVKxy7",
  "CLIENT_SECRET": "wwDdqef7If80P9aCla58AeY8O9QigZDVZOUi1j0tukucRZtuUC1fahWLxW9SGlWoVobRdccYGJjFmFKVZ0aJ9q2GnIF4Sf67JXTrBiPqK456JT08dV0uJH2WjtAq6zF3"
}
const root = document.getElementById('root');
ReactDOM.createRoot(root!).render(
  <React.StrictMode>
    <AuthProvider authority='https://auth.homeycommunity.space/application/o/hcs-app' redirectUri='http://localhost:9021/' clientId={config.CLIENT_ID} clientSecret={config.CLIENT_SECRET}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
