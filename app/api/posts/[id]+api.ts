// GET /api/posts/:id - Get single post
// PATCH /api/posts/:id - Update post (status change)

import { mockPosts } from "@/mocks/data";

export async function GET(request: Request, { id }: { id: string }) {
  const post = mockPosts.find((p) => p.id === id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json({ post });
}

export async function PATCH(request: Request, { id }: { id: string }) {
  const body = await request.json();
  const post = mockPosts.find((p) => p.id === id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Update allowed fields
  if (body.status) {
    post.status = body.status;
  }

  post.updatedAt = new Date().toISOString();

  return Response.json({ post });
}
