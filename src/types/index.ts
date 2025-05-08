// Admin tipi
export interface Admin {
  uid?: string;
  adminMail: string;
  adminName?: string;
  photoURL?: string;
  role?: string;
  permissions?: string[];
  createdAt?: Date | any;
  lastLogin?: Date | any;
}

// Kullanıcı tipi
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date | string | number;
  lastLogin?: Date | string;
  lastActive?: Date | string | null;
  isActive?: boolean;
  isBanned?: boolean;
  banStartDate?: any;
  banEndDate?: any;
  
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  location?: string;
  interests?: string[];
  followersCount?: number;
  followingCount?: number;
  followers?: string[];
  following?: string[];
}

// Bid (Teklif) tipi
export interface Bid {
  userId: string;
  amount: number;
  timestamp: number | string;
  userInfo?: User;
}

// Açık Artırma tipi
export interface Auction {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  creatorId: string;
  bidderId: string;
  endTime: number | string | Date;
  imageUrls: string[];
  isAuctionEnd: boolean;
  bidHistory: Bid[];
  createdAt?: number | string | Date;
  creator?: User;
  currentBidder?: User;
}

// Kullanıcı Grubu tipi
export interface UserGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
  createdBy: string;
}

// Rapor tipi
export interface Report {
  id: string;
  reporterId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string | number | Date;
  resolvedAt?: string | number | Date;
  resolvedBy?: string;
}

// Kullanıcı raporu
export interface UserReport extends Report {
  reportedId: string;
  reportedUser?: User;
  reporter?: User;
}

// Grup raporu
export interface GroupReport extends Report {
  reportedId: string;
  reportedGroup?: UserGroup;
  reporter?: User;
}

// Açık artırma raporu
export interface AuctionReport extends Report {
  reportedId: string;
  auctionId: string;
  reportedAuction?: Auction;
  reportedUser?: User;
  reporter?: User;
}

// Dashboard istatistikleri tipi
export interface DashboardStats {
  totalUsers: number;
  newUsers: number;
  activeAuctions: number;
  newAuctions: number;
  totalRevenue: number;
  revenueIncrease: number;
  completedAuctions: number;
  completionRate: number;
  recentActivity: Array<{
    userName: string;
    userPhoto?: string;
    action: string;
    item: string;
    date: string;
  }>;
  popularCategories: Array<{
    name: string;
    percentage: number;
  }>;
} 