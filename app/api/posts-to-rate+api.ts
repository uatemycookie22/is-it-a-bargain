// GET /api/posts-to-rate - Get posts available for current user to rate

import { mockPosts, mockRatings } from "@/mocks/data";

export async function GET(request: Request) {
  // TODO: Get userId from auth session
  const userId = "user-1";

  // Get IDs of posts user has already rated
  const ratedPostIds = mockRatings
    .filter((r) => r.userId === userId)
    .map((r) => r.postId);

  // Get live posts from other users that haven't been rated
  const postsToRate = mockPosts.filter(
    (p) =>
      p.userId !== userId &&
      p.status === "live" &&
      !ratedPostIds.includes(p.id)
  );

  return Response.json({ posts: postsToRate });
}
