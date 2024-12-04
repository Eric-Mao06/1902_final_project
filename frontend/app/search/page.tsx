'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import SearchResults from './search-results';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const query = searchParams.get('query');

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!query) {
    router.replace('/');
    return null;
  }

  return <SearchResults query={query} />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
