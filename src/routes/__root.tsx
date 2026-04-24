import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { handleAuthCallback } from '@netlify/identity'
import { Header } from '../components/Header'
import { AIChat } from '../components/AIChat'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'CaptureAfrica – Discover & Book African Photographers' },
      { name: 'description', content: 'Africa\'s premier photography marketplace. Discover talented photographers, view portfolios, and book instantly.' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  useEffect(() => {
    handleAuthCallback().catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
      <AIChat />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
