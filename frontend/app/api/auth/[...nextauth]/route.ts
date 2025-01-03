import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ }) {
      // Allow all email addresses since we verify through LinkedIn education
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, always redirect to setup
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/auth/setup`;
      }
      return url;
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Add this to handle auth errors
  },
} as NextAuthOptions);

export { handler as GET, handler as POST };
