import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) return null

        if (!user.passwordHash) return null

        const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordValid) return null

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          warehouseId: user.warehouse_id,
          clientId: user.client_id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.warehouseId = (user as any).warehouseId
        token.clientId = (user as any).clientId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).warehouseId = token.warehouseId
        ;(session.user as any).clientId = token.clientId
      }
      return session
    },
  },
}
