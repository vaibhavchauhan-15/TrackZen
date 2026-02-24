export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/planner/:path*', '/habits/:path*', '/analytics/:path*', '/settings/:path*'],
}
