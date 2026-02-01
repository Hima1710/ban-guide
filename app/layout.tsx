import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppShell } from '@/components/m3'
import ErrorBoundary from '@/components/ErrorBoundary'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteTitle = 'بان — دليلك للأماكن والخدمات'
const siteDescription = 'دليلك للأماكن والخدمات'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ban-guide.vercel.app'),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [{ url: '/logo.webp', sizes: 'any' }, { url: '/logo.webp', type: 'image/webp' }],
    shortcut: '/logo.webp',
    apple: '/logo.webp',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/logo.webp', width: 512, height: 512, alt: 'بان' }],
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/logo.webp'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth" style={{ height: '100%', overflow: 'hidden' }}>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/webp" href="/logo.webp" />
        <link rel="shortcut icon" type="image/webp" href="/logo.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily: "'Cairo', sans-serif",
          height: '100vh',
          overflowX: 'hidden',
          margin: 0,
        }}
        suppressHydrationWarning
      >
        <ErrorBoundary level="global">
          <AuthProvider>
            <ThemeProvider>
              <AppShell>{children}</AppShell>
              <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11" strategy="lazyOnload" />
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
