'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SearchResults from './search-results';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query');

  useEffect(() => {
    if (!query) {
      router.replace('/');
    }
  }, [query, router]);

  if (!query) {
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
