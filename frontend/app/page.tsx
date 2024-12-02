'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowRight, ArrowUpRight } from 'lucide-react';
import { API_URL } from '@/app/constants';
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from './context/sidebar-context';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isExpanded } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const placeholders = [
    "Who are the alumni working in artificial intelligence at Google?",
    "Who can help me understand what it's like to work in consulting?",
    "Which graduates are working in renewable energy startups?",
    "Who went to graduate school after working for a few years?",
    "Alumni who studied abroad and now work internationally"
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  useEffect(() => {
    async function checkUserProfile() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch(`${API_URL}/api/users/check?email=${encodeURIComponent(session.user.email)}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          if (!data.exists) {
            router.push('/auth/setup');
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
        } finally {
          setIsCheckingProfile(false);
        }
      }
    }

    if (status === 'authenticated') {
      checkUserProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsPlaceholderVisible(false); 
      setTimeout(() => {
        setCurrentPlaceholder(current => {
          const currentIndex = placeholders.indexOf(current);
          return placeholders[(currentIndex + 1) % placeholders.length];
        });
        setIsPlaceholderVisible(true); 
      }, 200); 
    }, 4000);

    return () => clearInterval(intervalId);
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

  // Show loading state
  if (status === 'loading' || isCheckingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full max-w-2xl px-4 transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-x-[40px]' : 'translate-x-[-20px]'
        }`}>
          <div className="flex flex-col items-center">
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight lg:text-4xl text-center mb-8 lg:mb-10">
              Where Ambition Meets{" "}
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
                  className="absolute right-2 bottom-2" 
                  size="sm"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {error && <p className="text-red-500/70 mt-2 text-center">{error}</p>}

              {/* "Try asking" buttons section */}
              <div className="mt-6">
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => handleTryAsking("Alumni working on tech startups")}
                  >
                    Alumni working on tech startups
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => handleTryAsking("Alumni mentors in data science")}
                  >
                    Alumni mentors in data science
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm py-1 px-2 sm:px-3"
                    onClick={() => handleTryAsking("Alumni who changed careers")}
                  >
                    Alumni who changed careers
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
