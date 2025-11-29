export type PostStatus = "pending" | "live" | "rated";

export type Post = {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  status: PostStatus;
  averageRating: number;
  ratingCount: number;
  ratingBreakdown?: { [key: number]: number };
  createdAt: string;
  updatedAt: string;
};

export type Rating = {
  id: string;
  postId: string;
  userId: string;
  rating: number; // 1-5
  createdAt: string;
};

export type User = {
  id: string;
  nickname: string;
  avatarUrl?: string;
  totalPosts: number;
  averageRating: number;
  totalRatingsGiven: number;
  pendingPostId?: string; // ID of unpublished post (if any)
  ratingsNeededToPublish: number; // 0 if post is published or no pending post
};
