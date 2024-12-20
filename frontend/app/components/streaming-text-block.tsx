'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../constants';

interface StreamingTextBlockProps {
  query: string;
  profile: {
    name?: string;
    role?: string;
    company?: string;
    summary?: string;
  };
}

export function StreamingTextBlock({ query, profile }: StreamingTextBlockProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function streamText() {
      const url = `${API_URL}/api/generate`;
      console.log('Making request to:', url);
      
      try {
        const requestBody = {
          query,
          profile: {
            name: profile.name || '',
            role: profile.role || '',
            company: profile.company || '',
            summary: profile.summary || '',
          },
        };
        console.log('Request body:', requestBody);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        
        if (response.status === 429) {
          const errorText = await response.text();
          setError(`Rate limit exceeded. Please try again later. ${errorText}`);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(errorText || `Failed to generate text: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done || cancelled) break;

          const chunk = decoder.decode(value, { stream: true });
          if (chunk.startsWith('Error:')) {
            setError(chunk.slice(7).trim());
            break;
          }
          accumulatedText += chunk;
          setText(accumulatedText);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to generate text';
          setError(errorMessage);
          console.error('Text generation error:', err);
        }
      }
    }

    streamText();

    return () => {
      cancelled = true;
    };
  }, [query, profile]);

  if (error) {
    return (
      <div className="text-sm text-red-500">
        <p>Error: {error}</p>
        <p className="mt-1">Please make sure the API key is configured correctly.</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {text || <span className="animate-pulse">Generating explanation...</span>}
    </p>
  );
}
