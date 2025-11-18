import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Solo permitir tu email
      const allowedEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

      if (user.email === allowedEmail) {
        return true;
      }

      // Denegar acceso a otros usuarios
      return false;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: '/admin-login',
    error: '/admin-login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
});
