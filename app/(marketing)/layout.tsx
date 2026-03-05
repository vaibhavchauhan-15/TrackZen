import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TrackZen – AI Study Planner & Habit Tracker | Free',
  description:
    'Master your goals with AI-powered study planning, habit tracking, and streak motivation. Free for students and professionals. Start in 2 minutes.',
  alternates: {
    canonical: 'https://trackzen-nine.vercel.app',
  },
  openGraph: {
    url: 'https://trackzen-nine.vercel.app',
    type: 'website',
  },
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TrackZen',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  url: 'https://trackzen-nine.vercel.app',
  description:
    'AI-powered study planning, habit tracking, and streak-based motivation for students and professionals.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI Study Plan Generator',
    'Habit Tracker',
    'Streak System',
    'Analytics Dashboard',
    'Exam Preparation Planner',
  ],
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      {children}
    </>
  )
}
