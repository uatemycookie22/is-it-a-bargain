import { Post, Rating, User } from "@/types";

const API_BASE = "/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

// Posts
export async function fetchMyPosts({ page = 0, search = "" }) {
  const params = new URLSearchParams({ page: String(page), search });
  return fetchAPI<{ posts: Post[]; nextPage: number | null }>(`/posts?${params}`);
}

export async function fetchPost(id: string) {
  return fetchAPI<{ post: Post }>(`/posts/${id}`);
}

export async function createPost(data: { title: string; description: string; price: number }) {
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
