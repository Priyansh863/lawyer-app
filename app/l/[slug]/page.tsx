"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ShortUrlPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      // Parse short URL format and redirect to full post page
      const queryString = window.location.search.slice(1);
      
      if (queryString && !queryString.includes('=')) {
        // Short URL format: ?Earth,lat,lng,altitude,timestamp,floor
        const parts = queryString.split(',');
        if (parts.length >= 3) {
          const params = new URLSearchParams();
          
          if (parts[0]) params.append('planet', parts[0]);
          if (parts[1]) params.append('lat', parts[1]);
          if (parts[2]) params.append('lng', parts[2]);
          if (parts[3]) params.append('altitude', parts[3]);
          if (parts[4]) params.append('timestamp', parts[4]);
          if (parts[5]) params.append('floor', parts[5]);
          
          // Redirect to full post page with parsed parameters
          router.replace(`/${slug}?${params.toString()}`);
          return;
        }
      }
      
      // If no spatial data, just redirect to the post
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
