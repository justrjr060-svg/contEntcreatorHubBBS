export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  date: string;
  isModerated?: boolean;
}

export interface ContentItem {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: 'video' | 'image' | 'blog';
  mediaUrl: string;
  minTier: number; // 0 = Public, 1 = Bronze, 2 = Silver, 3 = Gold
  likes: number;
  comments: Comment[];
  date: string;
  duration?: string;
  body?: string; // For blogs
  likedBy?: string[]; // userIds
}

export interface Plan {
  id: string;
  title: string;
  price: number;
  description: string;
  features: string[];
  interval: 'month' | 'year';
  tier: number; // 1 = Bronze, 2 = Silver, 3 = Gold
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  category: string;
  subscriberCount: number;
  plans: Plan[];
  posts: ContentItem[];
  tags: string[];
  isApproved: boolean;
  viewsCount: number;
  revenue: number;
  rating: number;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  title: string;
  content: string;
  likes: number;
  comments: Comment[];
  date: string;
  category: string; // 'general' | 'qa' | 'announcement' | 'collab'
  reportsCount: number;
  isPinned?: boolean;
  likedBy?: string[]; // userIds
}

export interface CreatorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  category: string;
  description: string;
  portfolioUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'system' | 'subscription' | 'comment' | 'community' | 'broadcast';
  read: boolean;
  date: string;
}

export interface Payment {
  id: string;
  userId: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  date: string;
  status: 'success' | 'failed';
  planTitle: string;
  couponCode?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  role: 'admin' | 'creator' | 'member';
  isVerified: boolean;
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
  activeSubscriptions: {
    [creatorId: string]: {
      planId: string;
      tier: number;
      startDate: string;
      expiryDate: string;
      status: 'active' | 'cancelled';
    };
  };
  favorites: string[]; // creatorIds
  status: 'active' | 'suspended';
}
