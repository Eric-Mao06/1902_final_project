'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 space-y-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Welcome to Linkd</h1>
        <p className="text-center text-muted-foreground">Sign in to continue</p>
        <Button 
          className="w-full" 
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          Sign in with Google
        </Button>
      </Card>
    </div>
  );
}
