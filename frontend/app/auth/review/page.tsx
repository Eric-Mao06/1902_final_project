'use client';

import { Suspense } from 'react';
import ReviewContent from './ReviewContent';
import { Loader2 } from 'lucide-react';

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}