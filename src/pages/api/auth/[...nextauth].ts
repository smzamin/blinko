import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { prisma } from '@/server/prisma';

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
          const user = await prisma.accounts.findMany({
            where: { name: credentials!.username, password: credentials!.password },
            select: { name: true, nickname: true, id: true }
          })
          if (user?.[0]) {
            return { id: user[0]!.id.toString(), name: user[0]!.name || '', nickname: user[0]!.nickname };
          }
          throw new Error(JSON.stringify({ errors: 'user not found', status: false }))
        } catch (error) {
          console.log(error)
          throw new Error(JSON.stringify({ errors: error.message, status: false }))
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
      return { ...session, token: token.token, }
    },
  },
});
