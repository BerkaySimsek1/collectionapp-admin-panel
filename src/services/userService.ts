import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, Timestamp, orderBy, limit, startAfter, serverTimestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Auction, UserGroup } from '../types';

/**
 * URL'nin geçerli olup olmadığını kontrol eden yardımcı fonksiyon
 */
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.trim() === "") return false;
  
  return true; // Tüm URL'leri geçerli kabul et, hata durumu img onError ile yakalanacak
};

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
        
        // Profil fotoğrafı kontrolü - farklı alanlarda olabilir
        let photoURL = "";
        
        // Önce photoURL kontrolü
        if (userData.photoURL) {
          photoURL = userData.photoURL;
        }
        // Sonra profileImageUrl kontrolü
        else if (userData.profileImageUrl) {
          photoURL = userData.profileImageUrl;
        }
        // Sonra profilePic kontrolü
        else if (userData.profilePic) {
          photoURL = userData.profilePic;
        }
        // Sonra photo ya da picture alanları
        else if (userData.photo) {
          photoURL = userData.photo;
        }
        else if (userData.picture) {
          photoURL = userData.picture;
        }
        
        const user: User = {
          uid: docSnapshot.id,
          email: userData.email || "",
          displayName: userData.displayName || userData.username || "",
          photoURL: photoURL,
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

// Kullanıcı verisinde profil fotoğrafı kontrolü - değişik alanlarda olabilir
const getProfileImageUrl = (userData: any): string => {
  if (!userData) return "";
  
  console.log("getProfileImageUrl - Ham kullanıcı verisi alanları:", Object.keys(userData));
  
  // Sırasıyla tüm olası profil fotoğrafı alanlarını kontrol et
  if (userData.photoURL && userData.photoURL.trim() !== "") {
    console.log("photoURL bulundu:", userData.photoURL);
    return userData.photoURL;
  }
  
  if (userData.profileImageUrl && userData.profileImageUrl.trim() !== "") {
    console.log("profileImageUrl bulundu:", userData.profileImageUrl);
    return userData.profileImageUrl;
  }
  
  if (userData.profilePic && userData.profilePic.trim() !== "") {
    console.log("profilePic bulundu:", userData.profilePic);
    return userData.profilePic;
  }
  
  if (userData.photo && userData.photo.trim() !== "") {
    console.log("photo bulundu:", userData.photo);
    return userData.photo;
  }
  
  if (userData.picture && userData.picture.trim() !== "") {
    console.log("picture bulundu:", userData.picture);
    return userData.picture;
  }
  
  if (userData.avatar && userData.avatar.trim() !== "") {
    console.log("avatar bulundu:", userData.avatar);
    return userData.avatar;
  }
  
  console.log("Hiçbir profil fotoğrafı alanı bulunamadı");
  return "";
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
    
    // Profil fotoğrafı kontrolü - farklı alanlarda olabilir
    const photoURL = getProfileImageUrl(userData);
    
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
        photoURL: photoURL,
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
    const q = query(auctionsRef, where('creator_id', '==', uid));
    const querySnapshot = await getDocs(q);
    
    const auctions: Auction[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const auctionData = docSnapshot.data();
      
      // Kullanıcı bilgilerini eklemek için
      let creatorData = null;
      let bidderData = null;
      
      // Oluşturan kullanıcının bilgilerini getir
      if (auctionData.creator_id) {
        const creatorDoc = await getDoc(doc(db, 'users', auctionData.creator_id));
        if (creatorDoc.exists()) {
          creatorData = creatorDoc.data() as User;
        }
      }
      
      // Son teklif veren kullanıcının bilgilerini getir
      if (auctionData.bidder_id && auctionData.bidder_id !== "") {
        const bidderDoc = await getDoc(doc(db, 'users', auctionData.bidder_id));
        if (bidderDoc.exists()) {
          bidderData = bidderDoc.data() as User;
        }
      }
      
      // Teklif geçmişindeki kullanıcıların bilgilerini getir
      const bidHistory = auctionData.bid_history ? await Promise.all(
        auctionData.bid_history.map(async (bid: any) => {
          let userInfo = undefined;
          
          if (bid.user_id) {
            const userDoc = await getDoc(doc(db, 'users', bid.user_id));
            if (userDoc.exists()) {
              userInfo = userDoc.data() as User;
            }
          }
          
          return {
            userId: bid.user_id || "",
            amount: bid.amount || 0,
            timestamp: bid.timestamp || 0,
            userInfo
          };
        })
      ) : [];
      
      // Auction nesnesini oluştur
      const auction: Auction = {
        id: docSnapshot.id,
        name: auctionData.name || "",
        description: auctionData.description || "",
        startingPrice: auctionData.starting_price || 0,
        creatorId: auctionData.creator_id || "",
        bidderId: auctionData.bidder_id || "",
        endTime: auctionData.end_time || 0,
        imageUrls: auctionData.image_urls || [],
        isAuctionEnd: auctionData.isAuctionEnd || false,
        bidHistory: bidHistory,
        createdAt: auctionData.created_at || 0,
        creator: creatorData || undefined,
        currentBidder: bidderData || undefined
      };
      
      auctions.push(auction);
    }
    
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