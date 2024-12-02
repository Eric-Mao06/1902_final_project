import 'next-auth';

declare module 'next-auth' {
  interface User {
    location?: string;
    company?: string;
    role?: string;
    summary?: string;
    linkedinUrl?: string;
    photoUrl?: string;
  }
  
  interface Session {
    user: User;
  }
}

export {}; // This empty export makes it a module
