/**
 * Converts an S3 URL to a proxy URL for accessing private images
 */
export function getProxyImageUrl(s3Url: string): string {
  if (!s3Url) return '/placeholder.jpg'
  
  // If it's already a proxy URL, return as is
  if (s3Url.startsWith('/api/proxy-image')) return s3Url
  
  // If it's an S3 URL, proxy it
  if (s3Url.includes('s3.') || s3Url.includes('amazonaws.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(s3Url)}`
  }
  
  // Otherwise return as is (for local/public URLs)
  return s3Url
}
