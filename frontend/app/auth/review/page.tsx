'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import ReviewContent from './review-content';

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const linkedinUrl = searchParams.get('linkedinUrl');

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!linkedinUrl) {
    router.push('/auth/setup');
    return null;
  }

  return <ReviewContent linkedinUrl={linkedinUrl} />;
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}