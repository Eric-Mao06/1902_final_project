'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/')}
            className="text-lg font-semibold"
          >
            linkd
          </button>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/api/auth/signout')}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
