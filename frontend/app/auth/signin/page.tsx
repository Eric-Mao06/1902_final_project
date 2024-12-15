'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function SignIn() {
  const router = useRouter();

  const handleSkipSignIn = () => {
    // Set cookie that expires in 24 hours
    Cookies.set('skipped-auth', 'true', { expires: 1 });
    router.push('/');
  };

  const handleGoogleSignIn = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    await signIn('google', { 
      callbackUrl: `${baseUrl}/auth/setup`,
      redirect: true
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 space-y-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Welcome to Linkd</h1>
        <p className="text-center text-muted-foreground">Sign in to connect with Penn alumni</p>
        <div className="space-y-4">
          <Button 
            className="w-full" 
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSkipSignIn}
          >
            Skip Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
}
