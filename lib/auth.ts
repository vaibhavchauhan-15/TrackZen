import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1)

          if (existingUser.length === 0) {
            // Create new user
            await db.insert(users).values({
              email: user.email!,
              name: user.name || 'User',
              avatarUrl: user.image,
              settings: {
                theme: 'dark',
                notifications: true,
                timezone: 'UTC',
              },
            })
          } else {
            // Update avatar if changed
            await db
              .update(users)
              .set({ avatarUrl: user.image })
              .where(eq(users.email, user.email!))
          }
          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1)

        if (dbUser.length > 0) {
          token.id = dbUser[0].id
          token.email = dbUser[0].email
          token.name = dbUser[0].name
          token.picture = dbUser[0].avatarUrl
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email!
        session.user.name = token.name!
        session.user.image = token.picture as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
