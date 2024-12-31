'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSkipSignIn = () => {
    // Set cookie that expires in 24 hours
    Cookies.set('skipped-auth', 'true', { expires: 1 });
    router.push('/');
  };

  const handleGoogleSignIn = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    await signIn('google', {
      callbackUrl: `${baseUrl}/auth/setup`,
      redirect: true,
    });
  };

  return (
    <Card className="p-8 space-y-6 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center">Welcome to Linkd</h1>
      <p className="text-center text-muted-foreground">Sign in to connect with Penn alumni</p>

      {error === 'AccessDenied' && (
        <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
          Only @upenn.edu email addresses are allowed to sign in.
        </div>
      )}

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
  );
}

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={
        <Card className="p-8 space-y-6 w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </Card>
      }>
        <SignInContent />
      </Suspense>
    </div>
  );
}
