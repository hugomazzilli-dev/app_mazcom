import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { AppProvider } from '@/contexts/AppContext'

export const metadata: Metadata = {
  title: 'MAZCOM',
  description: 'Gestion agence vidéo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ display: 'flex', minHeight: '100vh' }}>
        <AppProvider>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}