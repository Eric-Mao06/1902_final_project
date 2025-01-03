'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const placeholders = useMemo(() => [
    'Who are the alumni working in artificial intelligence at Google?',
    'Who can help me understand what it\'s like to work in consulting?',
    'Which graduates are working in renewable energy startups?',
    'Who went to graduate school after working for a few years?',
    'Alumni who studied abroad and now work internationally',
  ], []);

  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setCurrentPlaceholder((current) => {
          const currentIndex = placeholders.indexOf(current);
          return placeholders[(currentIndex + 1) % placeholders.length];
        });
        setIsPlaceholderVisible(true);
      }, 200);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [placeholders]);

  // Check for error parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const fromParam = params.get('from');
    
    if (fromParam === 'signup' && errorParam === 'not_penn_student') {
      setError('Access denied: You must be a University of Pennsylvania student to use this platform. Please make sure your LinkedIn profile includes your UPenn education.');
      // Clear the URL parameters without refreshing the page
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAsking = (question: string) => {
    setSearchQuery(question);
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={'w-full max-w-2xl px-4 transition-all duration-300 ease-in-out'}>
          <div className="flex flex-col items-center">
            <div
              onClick={() => router.push('/elo')}
              className="mb-6 px-4 py-2 border border-black hover:bg-black/5 cursor-pointer rounded-full text-sm text-center mx-auto"
            >
              <div className="flex items-center justify-center gap-1">
                <span>We just launched alumni ranking, click here to try it!</span>
                <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
              </div>
            </div>
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight lg:text-4xl text-center mb-8 lg:mb-10">
              Where Ambition Meets{' '}
              <span className="text-black dark:text-white inline-block">
                Experience.
              </span>
            </h1>
            <div className="w-full max-w-xl">
              <div className="relative">
                <Textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[80px] sm:min-h-[100px] w-full pr-16 sm:pr-20 resize-none font-sans text-sm sm:text-base"
                />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentPlaceholder}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isPlaceholderVisible ? 0.5 : 0, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="pointer-events-none absolute left-3 top-2 text-muted-foreground font-sans text-sm sm:text-base"
                  >
                    {!searchQuery && currentPlaceholder}
                  </motion.span>
                </AnimatePresence>
                <Button
                  className="absolute right-2 bottom-2 w-8 h-8 p-0 flex items-center justify-center"
                  size="sm"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>

              {error && <p className="text-red-500/70 mt-2 text-center">{error}</p>}

              {/* "Try asking" buttons section */}
              <div className="w-full flex flex-col items-center gap-2 mt-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => handleTryAsking('Alumni mentors in Palo Alto')}
                  >
                    Alumni mentors in Palo Alto
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => handleTryAsking('Alumni working on tech startups')}
                  >
                    Alumni working on tech startups
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                  onClick={() => handleTryAsking('Alumni working in biotech')}
                >
                  Alumni working in biotech
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
