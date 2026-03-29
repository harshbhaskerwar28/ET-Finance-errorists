import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { NavigationGuard } from "@/components/NavigationGuard"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ET AI | Investment Intelligence Platform',
  description: 'Your Personal AI-Powered Financial Co-Pilot. Real-time market intelligence, personalized news, conversational advisory, and portfolio management.',
  generator: 'v0.app',
  keywords: ['investment', 'AI', 'stocks', 'mutual funds', 'portfolio', 'market intelligence', 'financial planning'],
  authors: [{ name: 'Economic Times' }],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0f14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0d0f14] text-white selection:bg-red-500/30 selection:text-white`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-y-auto w-full relative">
              <NavigationGuard>
                {children}
              </NavigationGuard>
            </main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
