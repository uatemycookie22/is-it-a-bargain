// POST /api/ratings - Submit a rating

import { mockPosts, mockRatings, mockUsers } from "@/mocks/data";

export async function POST(request: Request) {
  const body = await request.json();
  const { postId, rating } = body;

  // TODO: Get userId from auth session
  const userId = "user-1";

  // Validate rating
  if (rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const post = mockPosts.find((p) => p.id === postId);
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Can't rate own post
  if (post.userId === userId) {
    return Response.json({ error: "Cannot rate your own post" }, { status: 400 });
  }

  // Check if already rated
  const existingRating = mockRatings.find(
    (r) => r.postId === postId && r.userId === userId
  );
  if (existingRating) {
    return Response.json({ error: "Already rated this post" }, { status: 400 });
  }

  // Create rating
  const newRating = {
    id: `rating-${Date.now()}`,
    postId,
    userId,
    rating,
    createdAt: new Date().toISOString(),
  };
  mockRatings.push(newRating);

  // Update post's average rating
  const postRatings = mockRatings.filter((r) => r.postId === postId);
  const avgRating =
    postRatings.reduce((sum, r) => sum + r.rating, 0) / postRatings.length;
  post.averageRating = Math.round(avgRating * 10) / 10;
  post.ratingCount = postRatings.length;

  // Update post status if enough ratings
  if (post.ratingCount >= 5 && post.status === "live") {
    post.status = "rated";
  }

  // Check if user's pending post should be published
  const user = mockUsers.find((u) => u.id === userId);
  if (user && user.pendingPostId && user.ratingsNeededToPublish > 0) {
    user.ratingsNeededToPublish--;
    user.totalRatingsGiven++;

    if (user.ratingsNeededToPublish === 0) {
      // Publish the pending post
      const pendingPost = mockPosts.find((p) => p.id === user.pendingPostId);
      if (pendingPost) {
        pendingPost.status = "live";
      }
      user.pendingPostId = undefined;
    }
  }

  return Response.json({ rating: newRating }, { status: 201 });
}
