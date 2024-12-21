// Handle API URL formatting
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL!;

// Remove trailing slash and ensure HTTPS for production URLs
const formatUrl = (url: string) => {
  // Remove trailing slash
  const withoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // For localhost, keep as is
  if (withoutSlash.includes('localhost')) {
    return withoutSlash;
  }
  
  // For production URLs, ensure HTTPS
  return withoutSlash.startsWith('https://') 
    ? withoutSlash 
    : withoutSlash.replace(/^http:\/\//, 'https://');
};

export const API_URL = formatUrl(rawApiUrl);