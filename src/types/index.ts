// Admin tipi
export interface Admin {
  adminId: string;
  adminMail: string;
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
}

// Açık Artırma tipi
export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdBy: string;
  images: string[];
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
  userId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
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