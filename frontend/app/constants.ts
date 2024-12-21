// Remove trailing slash from API URL if it exists and handle HTTPS
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL!;
const withoutTrailingSlash = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

// Only force HTTPS for non-localhost URLs
export const API_URL = withoutTrailingSlash.includes('localhost') 
  ? withoutTrailingSlash 
  : withoutTrailingSlash.replace('http:', 'https:');