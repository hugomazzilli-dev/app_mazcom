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
      <body style={{ display: 'flex', minHeight: '100vh' }}>
        <AppProvider>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}

