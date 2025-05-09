import './globals.css'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import CookieConsent from '@/components/CookieConsent'
import { Inter } from 'next/font/google'
import GoogleTagManager from '@/components/GoogleTagManager'
import MetaPixel from '@/components/MetaPixel'
import Providers from './providers'
import { Toaster } from "@/components/ui/toaster"

// Load custom fonts
const impact = localFont({
  src: '../../public/fonts/impact.ttf',
  variable: '--font-impact',
  display: 'swap',
})

const akrobat = localFont({
  src: '../../public/fonts/Akrobat-Regular.otf',
  variable: '--font-akrobat',
  display: 'swap',
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SMASH',
  description: 'Stress Management and Smashing Hub',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f36e21',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${impact.variable} ${akrobat.variable} ${inter.className}`}>
      <head>
        {/* Основные иконки */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Apple Touch иконки */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.jpg" />
        
        {/* Манифест и другие метаданные */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#f36e21" />
        <meta name="msapplication-TileColor" content="#f36e21" />
      </head>
      <body className="bg-[#231f20]">
        <Providers>
          <GoogleTagManager />
          <MetaPixel />
          {children}
          <CookieConsent />
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
