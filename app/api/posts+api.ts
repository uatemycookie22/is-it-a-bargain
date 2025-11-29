// GET /api/posts - List current user's posts
// POST /api/posts - Create a new post

import { mockPosts, mockUsers } from "@/mocks/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "0");
  const limit = 10;

  // TODO: Get userId from auth session
  const userId = "user-1";

  let posts = mockPosts.filter((p) => p.userId === userId);

  if (search) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = page * limit;
  const paginatedPosts = posts.slice(start, start + limit);
  const hasMore = start + limit < posts.length;

  return Response.json({
    posts: paginatedPosts,
    nextPage: hasMore ? page + 1 : null,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, price } = body;

  // TODO: Get userId from auth session
  const userId = "user-1";
  const user = mockUsers.find((u) => u.id === userId);

  // Check if user already has a pending post
  if (user?.pendingPostId) {
    return Response.json(
      { error: "You already have a pending post. Rate others to publish it." },
      { status: 400 }
    );
  }

  const newPost = {
    id: `post-${Date.now()}`,
    userId,
    title,
    description,
    price,
    status: "pending" as const,
    averageRating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TODO: Save to database
  mockPosts.push(newPost);

  // Update user's pending post
  if (user) {
    user.pendingPostId = newPost.id;
    user.ratingsNeededToPublish = 2;
  }

  return Response.json({ post: newPost }, { status: 201 });
}
