import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, Timestamp, orderBy, limit, startAfter, serverTimestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Auction, UserGroup } from '../types';

/**
 * Get all users with pagination
 * @param pageSize Number of users to retrieve
 * @param lastDocIndex Last document for pagination
 */
export const getAllUsers = async (pageSize = 10, lastDocIndex: number | null = null) => {
  try {
    console.log(`getAllUsers çağrıldı: pageSize=${pageSize}, lastDocIndex=${lastDocIndex}`);
    
    const usersRef = collection(db, "users");
    
    // Tüm kullanıcıları çek - sayfalama olmadan
    let q = query(usersRef);
    
    const querySnapshot = await getDocs(q);
    console.log(`Firebase'den toplam ${querySnapshot.docs.length} kullanıcı alındı`);
    
    if (querySnapshot.empty) {
      console.log("Kullanıcı koleksiyonu boş!");
      return { users: [], lastVisible: null };
    }
    
    // Tüm kullanıcıları işle
    const allUsers: User[] = [];
    querySnapshot.docs.forEach((docSnapshot) => {
      try {
        const userData = docSnapshot.data();
        console.log(`İşlenen kullanıcı: ${docSnapshot.id}, veri:`, userData);
        
        // Tarih alanlarını kontrol et
        let createdAt = null;
        if (userData.createdAt) {
          createdAt = userData.createdAt.toDate?.() || userData.createdAt;
        } else if (userData.created_at) {
          createdAt = userData.created_at.toDate?.() || userData.created_at;
        }
        
        let lastActive = null;
        if (userData.lastActive) {
          lastActive = userData.lastActive.toDate?.() || userData.lastActive;
        } else if (userData.last_active) {
          lastActive = userData.last_active.toDate?.() || userData.last_active;
        }
        
        const user: User = {
          uid: docSnapshot.id,
          email: userData.email || "",
          displayName: userData.displayName || userData.username || "",
          photoURL: userData.photoURL || "",
          isActive: userData.isActive !== false, // varsayılan olarak true
          isBanned: userData.isBanned === true,
          createdAt: createdAt || new Date(),
          lastActive: lastActive,
          username: userData.username || "",
          bio: userData.bio || "",
          location: userData.location || "",
          interests: userData.interests || [],
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          phone: userData.phone || "",
        };
        
        allUsers.push(user);
      } catch (err) {
        console.error(`Kullanıcı verisi işlenirken hata (uid: ${docSnapshot.id}):`, err, docSnapshot.data());
      }
    });
    
    // Kullanıcıları oluşturma tarihine göre sırala (en yeniden en eskiye)
    allUsers.sort((a, b) => {
      const dateA = a.createdAt ? (typeof a.createdAt === 'object' ? a.createdAt : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (typeof b.createdAt === 'object' ? b.createdAt : new Date(b.createdAt)) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Toplam işlenen kullanıcı sayısı: ${allUsers.length}`);
    
    // Sayfalama için kullanıcıları dilimle
    const startIndex = lastDocIndex || 0;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    console.log(`Sayfalanmış kullanıcı sayısı: ${paginatedUsers.length}, Başlangıç: ${startIndex}, Bitiş: ${endIndex}`);
    
    // Sonraki sayfa için lastVisible değeri
    const hasMoreUsers = endIndex < allUsers.length;
    const newLastVisible = hasMoreUsers ? endIndex : null;
    
    return {
      users: paginatedUsers,
      lastVisible: newLastVisible,
    };
  } catch (error) {
    console.error("Kullanıcılar getirilirken hata:", error);
    throw new Error("Kullanıcı verileri alınamadı: " + error);
  }
};

/**
 * Get user by ID
 * @param uid User ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    console.log(`getUserById çağrıldı: uid=${uid}, tip=${typeof uid}, uzunluk=${uid?.length}`);
    
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      console.error("getUserById: uid parametresi geçersiz:", uid);
      return null;
    }
    
    const userRef = doc(db, "users", uid);
    console.log(`Firestore'dan kullanıcı belgesi alınıyor: ${uid}`);
    
    const userSnapshot = await getDoc(userRef);
    console.log(`Kullanıcı belgesi alındı, belge var mı: ${userSnapshot.exists()}`);

    if (!userSnapshot.exists()) {
      console.log(`Kullanıcı bulunamadı: ${uid}`);
      return null;
    }

    const userData = userSnapshot.data();
    console.log(`Kullanıcı verisi alındı: ${uid}`, userData);
    
    if (!userData) {
      console.error(`Kullanıcı verisi boş: ${uid}`);
      return null;
    }
    
    // Tarih alanlarını kontrol et
    let createdAt = null;
    try {
      if (userData.createdAt) {
        createdAt = typeof userData.createdAt.toDate === 'function' 
          ? userData.createdAt.toDate() 
          : new Date(userData.createdAt);
      } else if (userData.created_at) {
        createdAt = typeof userData.created_at.toDate === 'function'
          ? userData.created_at.toDate()
          : new Date(userData.created_at);
      }
    } catch (dateErr) {
      console.error("createdAt alanı işlenirken hata:", dateErr);
      createdAt = new Date();
    }
    
    let lastActive = null;
    try {
      if (userData.lastActive) {
        lastActive = typeof userData.lastActive.toDate === 'function'
          ? userData.lastActive.toDate()
          : new Date(userData.lastActive);
      } else if (userData.last_active) {
        lastActive = typeof userData.last_active.toDate === 'function'
          ? userData.last_active.toDate()
          : new Date(userData.last_active);
      }
    } catch (dateErr) {
      console.error("lastActive alanı işlenirken hata:", dateErr);
    }
    
    try {
      const user: User = {
        uid: userSnapshot.id,
        email: userData.email || "",
        displayName: userData.displayName || userData.username || "",
        photoURL: userData.photoURL || "",
        isActive: userData.isActive !== false,
        isBanned: userData.isBanned === true,
        createdAt: createdAt || new Date(),
        lastActive: lastActive,
        username: userData.username || "",
        bio: userData.bio || "",
        location: userData.location || "",
        interests: userData.interests || [],
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        phone: userData.phone || "",
      };
  
      console.log(`İşlenmiş kullanıcı verisi:`, user);
      return user;
    } catch (parseErr) {
      console.error("Kullanıcı nesnesi oluşturulurken hata:", parseErr);
      return null;
    }
  } catch (error) {
    console.error("Kullanıcı getirilirken hata:", error);
    throw new Error("Kullanıcı verisi alınamadı: " + error);
  }
};

/**
 * Update user status
 * @param uid User ID
 * @param isActive New status
 */
export const updateUserStatus = async (
  uid: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Kullanıcı durumu güncellenirken hata:", error);
    return false;
  }
};

/**
 * Ban or unban user
 * @param uid User ID
 * @param isBanned New banned status
 */
export const updateUserBanStatus = async (
  uid: string,
  isBanned: boolean
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isBanned,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Kullanıcı engelleme durumu güncellenirken hata:", error);
    return false;
  }
};

/**
 * Delete user
 * @param uid User ID
 */
export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Kullanıcı silinirken hata:", error);
    return false;
  }
};

/**
 * Get new users count for last 24 hours
 */
export const getNewUsersCount = async (): Promise<number> => {
  try {
    const usersRef = collection(db, "users");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const q = query(
      usersRef,
      where("createdAt", ">=", yesterday)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Yeni kullanıcı sayısı alınırken hata:", error);
    return 0;
  }
};

/**
 * Gets a user's auctions
 * @param uid User ID
 * @returns Promise<Auction[]>
 */
export const getUserAuctions = async (uid: string): Promise<Auction[]> => {
  try {
    const auctionsRef = collection(db, 'auctions');
    const q = query(auctionsRef, where('createdBy', '==', uid));
    const querySnapshot = await getDocs(q);
    
    const auctions: Auction[] = [];
    querySnapshot.forEach((doc) => {
      const auctionData = doc.data();
      auctions.push({
        id: doc.id,
        title: auctionData.title || '',
        description: auctionData.description || '',
        startingPrice: auctionData.startingPrice || 0,
        currentPrice: auctionData.currentPrice || 0,
        startDate: auctionData.startDate ? 
          (typeof auctionData.startDate.toDate === 'function' ? auctionData.startDate.toDate().toISOString() : auctionData.startDate) 
          : '',
        endDate: auctionData.endDate ? 
          (typeof auctionData.endDate.toDate === 'function' ? auctionData.endDate.toDate().toISOString() : auctionData.endDate) 
          : '',
        status: auctionData.status || 'active',
        createdBy: auctionData.createdBy || '',
        images: auctionData.images || []
      } as Auction);
    });
    
    return auctions;
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    return [];
  }
};

/**
 * Gets a user's groups
 * @param uid User ID
 * @returns Promise<UserGroup[]>
 */
export const getUserGroups = async (uid: string): Promise<UserGroup[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    const querySnapshot = await getDocs(q);
    
    const groups: UserGroup[] = [];
    querySnapshot.forEach((doc) => {
      const groupData = doc.data();
      groups.push({
        id: doc.id,
        name: groupData.name || '',
        description: groupData.description || '',
        members: groupData.members || [],
        createdAt: groupData.createdAt ? 
          (typeof groupData.createdAt.toDate === 'function' ? groupData.createdAt.toDate().toISOString() : groupData.createdAt) 
          : '',
        createdBy: groupData.createdBy || ''
      } as UserGroup);
    });
    
    return groups;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}; 