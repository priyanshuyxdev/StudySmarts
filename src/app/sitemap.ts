
import type { MetadataRoute } from 'next';

// Replace with your actual deployed website URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/student`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Add other important static pages here if any
  ];
}
