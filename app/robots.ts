import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/habits/', '/planner/', '/api/', '/login/'],
      },
    ],
    sitemap: 'https://trackzen-nine.vercel.app/sitemap.xml',
  }
}
