import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { prisma } from '@/server/prisma';
import { verifyPassword } from 'prisma/seed';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "User", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log({ credentials })
          const users = await prisma.accounts.findMany({
            where: { name: credentials!.username },
            select: { name: true, nickname: true, id: true, role: true, password: true }
          })
          if (users.length === 0) {
            throw new Error("user not found")
          }
          console.log(users, 'users')
          const correctUsers = (await Promise.all(users.map(async (user) => {
            if (await verifyPassword(credentials!.password, user.password ?? '')) {
              return user
            }
          }))).filter(user => user !== undefined)
          console.log(correctUsers, 'correctUsers')
          if (!correctUsers || correctUsers.length === 0) {
            throw new Error("password is incorrect")
          }
          const user = correctUsers![0]
          return { id: user!.id.toString(), name: user!.name || '', nickname: user!.nickname, role: user!.role };
        } catch (error) {
          console.log(error)
          throw new Error(error.message)
        }
      }
    })
  ],
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        //@ts-ignore
        token.nickname = user.nickname
        //@ts-ignore
        token.role = user.role
        //@ts-ignore
        token.id = user.id
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      //@ts-ignore
      session.user!.nickname = token.nickname
      //@ts-ignore
      session.user!.id = token.id
      //@ts-ignore
      session.user!.role = token.role
      return { ...session, token: token.token, }
    },
  },
  session: {
    // Set session maxAge to 30 days (30 days * 24 hours * 60 minutes * 60 seconds)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
});
