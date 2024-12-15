// Remove trailing slash from API URL if it exists
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL!;
export const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;