import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grab The Beyond - Smart Travel Assistant',
  description: 'Real-time incident map with AI assistant powered by Puter AI for Da Nang tourism',
  keywords: ['Da Nang', 'tourism', 'AI assistant', 'travel', 'incident map', 'Grab'],
  authors: [{ name: 'Grab The Beyond Team' }],
  openGraph: {
    title: 'Grab The Beyond - Smart Travel Assistant',
    description: 'Real-time incident map with AI assistant for Da Nang',
    type: 'website',
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
        {/* Puter AI SDK - FREE AI (GPT-5, Claude, Gemini) */}
        <Script
          src="https://js.puter.com/v2/"
          strategy="beforeInteractive"
        />
        
        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
