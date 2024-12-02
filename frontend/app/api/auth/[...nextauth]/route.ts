import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      try {
        if (!session.user?.email) {
          console.log('No email in session:', session);
          return session;
        }

        console.log('\n=== Fetching user profile ===');
        console.log('Session before fetch:', session);
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

        // Fetch user profile from your backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'email': session.user.email,
          },
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('\nFetched user data:', userData);
          
          // Update session with all user data from MongoDB
          session.user = {
            ...session.user,
            ...userData,
          };
          
          console.log('\nUpdated session user:', session.user);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user profile:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
        }
      } catch (error) {
        console.error('Error in session callback:', error);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST };
