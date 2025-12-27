import { Post, Rating, User } from "@/types";
import { authClient } from "./auth-client";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "https://bargain-api.callingallheroes.net") + "/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[API] Fetching: ${url}`);
  
  const cookies = authClient.getCookie();
  const headers = {
    "Content-Type": "application/json",
    ...(cookies ? { "Cookie": cookies } : {}),
  };
  
  const res = await fetch(url, {
    headers,
    credentials: "omit",
    ...options,
  });

  console.log(`[API] Response status: ${res.status}`);

  if (!res.ok) {
    const error = await res.json();
    console.error(`[API] Error:`, error);
    throw new Error(error.error || "API Error");
  }

  const data = await res.json();
  console.log(`[API] Response data:`, data);
  return data;
}

// Posts
export async function fetchMyPosts({ page = 0, search = "" }) {
  const params = new URLSearchParams({ page: String(page), search });
  return fetchAPI<{ posts: Post[]; nextPage: number | null }>(`/posts?${params}`);
}

export async function fetchPost(id: string) {
  return fetchAPI<{ post: Post }>(`/posts/${id}`);
}

export async function createPost(data: { title: string; description: string; price: number; listingUrl: string; imageUrl: string }) {
  return fetchAPI<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Rating
export async function fetchPostsToRate() {
  return fetchAPI<{ posts: Post[] }>("/posts-to-rate");
}

export async function submitRating(data: { postId: string; rating: number }) {
  return fetchAPI<{ rating: Rating }>("/ratings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// User
export async function fetchUser() {
  return fetchAPI<{ user: User }>("/user");
}

export async function checkUsernameAvailable(username: string) {
  return fetchAPI<{ available: boolean; error?: string }>(`/users/username-available?username=${encodeURIComponent(username)}`);
}

// Images
export async function getPresignedUrl(contentType: string, fileExtension?: string) {
  return fetchAPI<{ uploadUrl: string; imageUrl: string; key: string }>("/images/upload", {
    method: "POST",
    body: JSON.stringify({ contentType, fileExtension }),
  });
}
