// GET /api/user - Get current user profile

import { mockUsers, mockPosts } from "@/mocks/data";

export async function GET(request: Request) {
  // TODO: Get userId from auth session
  const userId = "user-1";

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate stats
  const userPosts = mockPosts.filter((p) => p.userId === userId);
  const totalPosts = userPosts.length;
  const ratedPosts = userPosts.filter((p) => p.ratingCount > 0);
  const averageRating =
    ratedPosts.length > 0
      ? ratedPosts.reduce((sum, p) => sum + p.averageRating, 0) / ratedPosts.length
      : 0;

  return Response.json({
    user: {
      ...user,
      totalPosts,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  });
}
