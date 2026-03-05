import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import SessionProvider from '@/components/providers/session-provider'
import { SWRProvider } from '@/components/providers/swr-provider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

const BASE_URL = 'https://trackzen-nine.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'TrackZen – AI Study Planner & Habit Tracker | Free',
    template: '%s | TrackZen',
  },
  description:
    'Master your goals with AI-powered study planning, habit tracking, and streak motivation. Free for students and professionals. Start in 2 minutes.',
  keywords: [
    'study planner',
    'habit tracker',
    'AI study planner',
    'productivity app',
    'exam preparation',
    'streak tracker',
    'goal tracking',
    'study schedule generator',
  ],
  authors: [{ name: 'TrackZen' }],
  creator: 'TrackZen',
  publisher: 'TrackZen',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'TrackZen',
    title: 'TrackZen – AI Study Planner & Habit Tracker | Free',
    description:
      'Master your goals with AI-powered study planning, habit tracking, and streak motivation. Free for students and professionals. Start in 2 minutes.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'TrackZen – AI Study Planner & Habit Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackZen – AI Study Planner & Habit Tracker | Free',
    description:
      'Master your goals with AI-powered study planning, habit tracking, and streak motivation. Free for students and professionals.',
    images: ['/opengraph-image'],
    creator: '@trackzen',
  },
  icons: {
    icon: '/TrackZen_sign.png',
    apple: '/TrackZen_sign.png',
  },
  alternates: {
    canonical: BASE_URL,
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TrackZen',
  url: BASE_URL,
  logo: `${BASE_URL}/TrackZen_logo.png`,
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TrackZen',
  url: BASE_URL,
  description:
    'AI-powered study planning, habit tracking, and streak-based motivation for students and professionals.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta name="theme-color" content="#8b5cf6" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <SWRProvider>
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
