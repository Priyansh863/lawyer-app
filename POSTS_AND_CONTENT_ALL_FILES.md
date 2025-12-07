# All Posts and Content Related Files and APIs

## API URL Configuration
**Hosted API:** `https://d3qiclz5mtkmyk.cloudfront.net/api/v1`

---

## 1. Main Posts API - `lib/api/posts-api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d3qiclz5mtkmyk.cloudfront.net/api/v1';

// Get token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

// Get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

// Interfaces
export interface SpatialInfo {
  planet?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  timestamp?: string;
  floor?: number;
}

export interface Citation {
  type: 'spatial' | 'user' | 'url';
  content: string;
  spatialInfo?: SpatialInfo;
  userId?: string;
  url?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
  slug: string;
  spatialInfo?: SpatialInfo;
  citations: Citation[];
  hashtag?: string;
  hashtags?: string[];
  usefulLinks?: {
    title: string;
    url: string;
    description?: string;
  }[];
  customUrl?: string;
  shortUrl?: string;
  qrCodeUrl?: string;
  status: 'draft' | 'published';
  isAiGenerated?: boolean;
  aiPrompt?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  spatialInfo?: SpatialInfo;
  citations?: Citation[];
  hashtag?: string;
  status?: 'draft' | 'published';
  image?: string;
}

export interface GenerateAiPostData {
  prompt?: string;
  topic?: string;
  tone?: 'professional' | 'casual' | 'formal' | 'friendly';
  length?: 'short' | 'long';
  includeHashtags?: boolean;
  spatialInfo?: SpatialInfo;
  citations?: Citation[];
  image?: string;
  language?: 'en' | 'ko';
}

// API Functions

/**
 * Create a new post
 */
export const createPost = async (data: CreatePostData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/create`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Generate AI post
 */
export const generateAiPost = async (data: GenerateAiPostData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/generate-ai`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating AI post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all posts with pagination
 */
export const getPosts = async (page = 1, limit = 10, status = 'all', type = 'all') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/list?page=${page}&limit=${limit}&status=${status}&type=${type}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get single post by slug
 */
export const getPostBySlug = async (slug: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/slug/${slug}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update post
 */
export const updatePost = async (id: string, data: Partial<CreatePostData>) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/post/update/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete post
 */
export const deletePost = async (id: string) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/post/delete/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error deleting post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Generate QR code for post
 */
export const generateQrCode = async (slug: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/qr-code/${slug}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    throw error.response?.data || error;
  }
}

/**
 * Generate AI image
 */
export const generateAiImage = async ({ prompt }: { prompt: string }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/generate-image`,
      { prompt },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating AI image:', error);
    throw error.response?.data || error;
  }
};
```

---

## 2. API Endpoints Summary

### Base URL
```
https://d3qiclz5mtkmyk.cloudfront.net/api/v1
```

### All Endpoints

1. **Create Post**
   - `POST /post/create`
   - Body: `{ title, content, spatialInfo?, citations?, hashtag?, status?, image? }`

2. **Generate AI Post**
   - `POST /post/generate-ai`
   - Body: `{ prompt?, topic?, tone?, length?, includeHashtags?, spatialInfo?, citations?, image?, language? }`

3. **Get Posts List**
   - `GET /post/list?page=1&limit=10&status=all&type=all`

4. **Get Post by Slug**
   - `GET /post/slug/{slug}`

5. **Update Post**
   - `PUT /post/update/{id}`
   - Body: `{ title?, content?, spatialInfo?, citations?, hashtag?, status?, image? }`

6. **Delete Post**
   - `DELETE /post/delete/{id}`

7. **Generate QR Code**
   - `POST /post/qr-code/{slug}`

8. **Generate AI Image**
   - `POST /post/generate-image`
   - Body: `{ prompt }`

---

## 3. Posts Page - `app/posts/page.tsx`

This is the main Posts and Content page that displays all posts and allows creating new ones.

**Features:**
- List all published posts with pagination
- Create new posts (manual or AI-generated)
- View post details with expand/collapse
- Copy and open custom URLs
- Generate QR codes
- Display hashtags, citations, and useful links
- Show AI-generated badge
- Location information display

**Key Functions:**
- `fetchPosts(page)` - Fetches posts from API
- `handlePostCreated(post)` - Adds new post to list
- `copyUrl(url, type)` - Copies URL to clipboard
- `toggleExpandPost(postId)` - Expands/collapses post content

---

## 4. Component Files

### `components/posts/post-creator.tsx`
- Full post creation interface
- Manual post creation
- AI-powered post generation
- Image upload and AI image generation
- Location/spatial information input
- Citations management
- Hashtags input
- Useful links management
- Draft/Publish status

### `components/posts/qr-code-generator.tsx`
- Generates QR codes for posts
- Download QR code as PNG
- Share QR code
- Display QR code in dialog

### `components/posts/location-url-generator.tsx`
- Generate custom URLs with location data
- Generate short URLs
- URL preview and validation

---

## 5. Related Files

### `app/posts/layout.tsx`
Layout wrapper for posts page

### `lib/api/post-api.ts`
Alternative/legacy post API (similar functionality)

---

## 6. Usage in Electron Desktop App

All these files will work **exactly the same** in your Electron desktop application because:

✅ They use the **hosted API** (`https://d3qiclz5mtkmyk.cloudfront.net/api/v1`)
✅ No local server needed
✅ Same authentication (localStorage token)
✅ Same UI components
✅ Same features and functionality

---

## 7. Complete Integration Example

```typescript
// In your Electron app, the posts page will work like this:

import { getPosts, createPost, generateAiPost } from '@/lib/api/posts-api';

// Fetch posts
const posts = await getPosts(1, 10, 'published');

// Create a post
const newPost = await createPost({
  title: "My Post",
  content: "Post content here",
  status: "published"
});

// Generate AI post
const aiPost = await generateAiPost({
  prompt: "Write about legal rights",
  tone: "professional",
  length: "long",
  language: "en"
});
```

---

## 8. Authentication

All API calls require Bearer token authentication:

```typescript
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

// Headers for all requests
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Summary

**Total Files for Posts & Content:**
1. `lib/api/posts-api.ts` - Main API file
2. `app/posts/page.tsx` - Main page
3. `components/posts/post-creator.tsx` - Post creation component
4. `components/posts/qr-code-generator.tsx` - QR code component
5. `components/posts/location-url-generator.tsx` - URL generator component
6. `app/posts/layout.tsx` - Layout wrapper

**All use the same hosted API:** `https://d3qiclz5mtkmyk.cloudfront.net/api/v1`

**Ready for Electron:** No changes needed, works identically in desktop app!
