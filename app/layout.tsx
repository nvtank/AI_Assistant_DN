import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Findly - AI Assistant for Da Nang',
  description: 'Real-time incident map with AI assistant powered by Google Gemini for Da Nang tourism',
  keywords: ['Da Nang', 'tourism', 'AI assistant', 'travel', 'incident map', 'Grab'],
  authors: [{ name: 'Grab The Beyond Team' }],
  icons: {
    icon: '/canvas.png',
    shortcut: '/canvas.png',
    apple: '/canvas.png',
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
